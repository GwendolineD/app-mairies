-- =============================================================================
-- Migration: in-app notification center
--
-- - Scope every notification to a commune (commune_id NOT NULL)
-- - Promote kind / tag / context_type / context_id from the JSON payload to
--   real columns so the UI can filter, iconify and build URLs without parsing
-- - Backfill legacy rows, then delete rows that can never be displayed
--   (message notifications now live in the inbox; orphans without content)
-- - Trigger: delete notifications when the related content row is deleted
-- - RPCs: count_unread_notifications, list_my_notifications (with
--   context_status + is_author so the UI can decide navigability)
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. New columns
-- -----------------------------------------------------------------------------

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS commune_id uuid REFERENCES public.communes (id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS tag text,
  ADD COLUMN IF NOT EXISTS context_type public.context_type,
  ADD COLUMN IF NOT EXISTS context_id uuid;

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_kind_check;
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_kind_check
  CHECK (kind IN ('new_content', 'engagement', 'nudge', 'initiative_to_event', 'system'));

-- -----------------------------------------------------------------------------
-- 2. Backfill from payload (tolerant casts: malformed uuids become NULL)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.try_uuid(p_value text)
RETURNS uuid
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_value ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN p_value::uuid
    ELSE NULL
  END;
$$;

-- 2a. Message notifications are no longer part of the center (the inbox already
--     shows unread conversations). Delete the legacy rows outright.
DELETE FROM public.notifications
WHERE payload ? 'conversation_id';

-- 2b. kind / tag
UPDATE public.notifications
SET
  kind = CASE
    WHEN payload->>'kind' IN ('new_content', 'engagement', 'nudge', 'initiative_to_event', 'system')
      THEN payload->>'kind'
    WHEN payload->>'tag' LIKE 'nudge:%' THEN 'nudge'
    WHEN payload->>'tag' = 'engagement-first-week'
      OR payload->>'tag' = 'notification-activation-reminder' THEN 'system'
    ELSE kind
  END,
  tag = COALESCE(tag, payload->>'tag');

-- 2c. context_type / context_id: from payload keys, then from the tag.
UPDATE public.notifications
SET
  context_type = CASE
    WHEN payload->>'context_type' IN ('announcement', 'initiative', 'event')
      THEN (payload->>'context_type')::public.context_type
    WHEN kind = 'initiative_to_event' THEN 'event'::public.context_type
    WHEN tag LIKE 'nudge:announcement:%' THEN 'announcement'::public.context_type
    WHEN tag LIKE 'nudge:initiative:%' THEN 'initiative'::public.context_type
    WHEN tag LIKE 'nudge:event:%' THEN 'event'::public.context_type
    ELSE context_type
  END,
  context_id = COALESCE(
    context_id,
    public.try_uuid(payload->>'context_id'),
    CASE WHEN kind = 'initiative_to_event' THEN public.try_uuid(payload->>'event_id') END,
    CASE WHEN tag LIKE 'nudge:%' THEN public.try_uuid(split_part(tag, ':', 3)) END
  );

-- 2d. commune_id: from the related content, else from the user's active commune.
UPDATE public.notifications n
SET commune_id = a.commune_id
FROM public.announcements a
WHERE n.commune_id IS NULL AND n.context_type = 'announcement' AND a.id = n.context_id;

UPDATE public.notifications n
SET commune_id = i.commune_id
FROM public.initiatives i
WHERE n.commune_id IS NULL AND n.context_type = 'initiative' AND i.id = n.context_id;

UPDATE public.notifications n
SET commune_id = e.commune_id
FROM public.events e
WHERE n.commune_id IS NULL AND n.context_type = 'event' AND e.id = n.context_id;

UPDATE public.notifications n
SET commune_id = p.active_commune_id
FROM public.profiles p
WHERE n.commune_id IS NULL AND p.user_id = n.user_id AND p.active_commune_id IS NOT NULL;

-- 2e. Remove rows that can never be displayed correctly:
--     - content-bound rows whose content no longer exists (dead links)
--     - rows without any resolvable commune
DELETE FROM public.notifications n
WHERE n.kind <> 'system'
  AND (
    n.context_type IS NULL
    OR n.context_id IS NULL
    OR (n.context_type = 'announcement' AND NOT EXISTS (SELECT 1 FROM public.announcements a WHERE a.id = n.context_id))
    OR (n.context_type = 'initiative' AND NOT EXISTS (SELECT 1 FROM public.initiatives i WHERE i.id = n.context_id))
    OR (n.context_type = 'event' AND NOT EXISTS (SELECT 1 FROM public.events e WHERE e.id = n.context_id))
  );

DELETE FROM public.notifications
WHERE commune_id IS NULL;

DO $$
BEGIN
  ASSERT (SELECT count(*) FROM public.notifications WHERE commune_id IS NULL) = 0,
    'notifications.commune_id backfill left NULL rows';
END;
$$;

ALTER TABLE public.notifications
  ALTER COLUMN commune_id SET NOT NULL;

-- -----------------------------------------------------------------------------
-- 3. Indexes
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_notifications_user_commune_created
  ON public.notifications (user_id, commune_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON public.notifications (user_id, commune_id)
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_user_tag_unread
  ON public.notifications (user_id, tag)
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_context
  ON public.notifications (context_type, context_id);

-- -----------------------------------------------------------------------------
-- 4. Cascade trigger: content deleted -> related notifications deleted
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.delete_notifications_for_content()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE context_type = TG_ARGV[0]::public.context_type
    AND context_id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_announcements_delete_notifications ON public.announcements;
CREATE TRIGGER trg_announcements_delete_notifications
AFTER DELETE ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.delete_notifications_for_content ('announcement');

DROP TRIGGER IF EXISTS trg_initiatives_delete_notifications ON public.initiatives;
CREATE TRIGGER trg_initiatives_delete_notifications
AFTER DELETE ON public.initiatives
FOR EACH ROW
EXECUTE FUNCTION public.delete_notifications_for_content ('initiative');

DROP TRIGGER IF EXISTS trg_events_delete_notifications ON public.events;
CREATE TRIGGER trg_events_delete_notifications
AFTER DELETE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.delete_notifications_for_content ('event');

-- -----------------------------------------------------------------------------
-- 5. RPC: unread count for the badge
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.count_unread_notifications(p_commune_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::int
  FROM public.notifications n
  WHERE n.user_id = (select auth.uid())
    AND n.commune_id = p_commune_id
    AND n.read_at IS NULL;
$$;

GRANT EXECUTE ON FUNCTION public.count_unread_notifications(uuid) TO authenticated;

-- -----------------------------------------------------------------------------
-- 6. RPC: paginated list with content status + authorship
--
-- context_status:
--   available | finished | archived | suspended | deleted
-- is_author: the current user authored the related content (via memberships)
-- Keyset pagination on (created_at DESC, id DESC).
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.list_my_notifications(
  p_commune_id uuid,
  p_limit int DEFAULT 20,
  p_before_created_at timestamptz DEFAULT NULL,
  p_before_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  kind text,
  tag text,
  title text,
  body text,
  payload jsonb,
  context_type public.context_type,
  context_id uuid,
  read_at timestamptz,
  created_at timestamptz,
  context_status text,
  is_author boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    n.id,
    n.kind,
    n.tag,
    n.title,
    n.body,
    n.payload,
    n.context_type,
    n.context_id,
    n.read_at,
    n.created_at,
    CASE
      WHEN n.context_type IS NULL THEN 'available'
      WHEN n.context_type = 'announcement' THEN COALESCE((
        SELECT CASE
          WHEN a.suspended_at IS NOT NULL THEN 'suspended'
          WHEN a.status = 'archivee' THEN 'archived'
          WHEN a.status IN ('pourvue', 'expiree') THEN 'finished'
          ELSE 'available'
        END
        FROM public.announcements a WHERE a.id = n.context_id
      ), 'deleted')
      WHEN n.context_type = 'initiative' THEN COALESCE((
        SELECT CASE
          WHEN i.suspended_at IS NOT NULL THEN 'suspended'
          WHEN i.status = 'archived' THEN 'finished'
          ELSE 'available'
        END
        FROM public.initiatives i WHERE i.id = n.context_id
      ), 'deleted')
      WHEN n.context_type = 'event' THEN COALESCE((
        SELECT CASE
          WHEN e.suspended_at IS NOT NULL THEN 'suspended'
          WHEN e.status = 'archived' OR e.ends_at < now() THEN 'finished'
          ELSE 'available'
        END
        FROM public.events e WHERE e.id = n.context_id
      ), 'deleted')
      ELSE 'available'
    END AS context_status,
    COALESCE((
      SELECT m.user_id = (select auth.uid())
      FROM public.memberships m
      WHERE m.id = CASE n.context_type
        WHEN 'announcement' THEN (SELECT a.author_membership_id FROM public.announcements a WHERE a.id = n.context_id)
        WHEN 'initiative' THEN (SELECT i.author_membership_id FROM public.initiatives i WHERE i.id = n.context_id)
        WHEN 'event' THEN (SELECT e.author_membership_id FROM public.events e WHERE e.id = n.context_id)
      END
    ), false) AS is_author
  FROM public.notifications n
  WHERE n.user_id = (select auth.uid())
    AND n.commune_id = p_commune_id
    AND (
      p_before_created_at IS NULL
      OR n.created_at < p_before_created_at
      OR (n.created_at = p_before_created_at AND p_before_id IS NOT NULL AND n.id < p_before_id)
    )
  ORDER BY n.created_at DESC, n.id DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.list_my_notifications(uuid, int, timestamptz, uuid) TO authenticated;

COMMIT;
