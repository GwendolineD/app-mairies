-- =============================================================================
-- Migration: enhanced messaging + notification preferences + push subscriptions
--
-- - Denormalize last_message_* on conversations (cheap list view)
-- - Per-user archive (soft-delete with 30-day trash) on conversation_participants
-- - 6 user notification toggles (incoming messages × {announcement|initiative|event}
--   and new posts × {announcement|initiative|event})
-- - Push subscription registry for Web Push (mobile)
-- - RPC list_my_conversations to fetch enriched conversations in a single round-trip
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. Conversations: denormalize last message for efficient list view
-- =============================================================================

ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS last_message_at timestamptz;

ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS last_message_id uuid;

ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS last_message_preview text;

ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS last_message_sender_id uuid REFERENCES auth.users (id) ON DELETE SET NULL;

-- Backfill from existing messages (idempotent)
WITH latest AS (
  SELECT DISTINCT ON (conversation_id)
    conversation_id, id, body, created_at, sender_id
  FROM public.messages
  ORDER BY conversation_id, created_at DESC
)
UPDATE public.conversations c
SET
  last_message_at = latest.created_at,
  last_message_id = latest.id,
  last_message_preview = left(latest.body, 240),
  last_message_sender_id = latest.sender_id
FROM latest
WHERE c.id = latest.conversation_id;

CREATE INDEX IF NOT EXISTS idx_conversations_commune_last_message
ON public.conversations (commune_id, last_message_at DESC);

-- Trigger: keep last_message_* in sync, bump updated_at, and auto-restore archive for recipients
CREATE OR REPLACE FUNCTION public.update_conversation_on_message_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at,
      last_message_id = NEW.id,
      last_message_preview = left(NEW.body, 240),
      last_message_sender_id = NEW.sender_id,
      updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;

  -- New activity restores the conversation for participants that had archived it
  UPDATE public.conversation_participants
  SET archived_at = NULL
  WHERE conversation_id = NEW.conversation_id
    AND user_id <> NEW.sender_id
    AND archived_at IS NOT NULL;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_messages_update_conversation ON public.messages;
CREATE TRIGGER trg_messages_update_conversation
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_on_message_insert ();

-- =============================================================================
-- 2. Conversation participants: per-user archive (trash) for soft-delete
-- =============================================================================

ALTER TABLE public.conversation_participants
ADD COLUMN IF NOT EXISTS archived_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_conv_participants_user_active
ON public.conversation_participants (user_id)
WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_conv_participants_user_archived
ON public.conversation_participants (user_id, archived_at DESC)
WHERE archived_at IS NOT NULL;

-- Allow the participant to update their own row (archive / last_read_at)
DROP POLICY IF EXISTS conversation_participants_update_self ON public.conversation_participants;
CREATE POLICY conversation_participants_update_self ON public.conversation_participants
FOR UPDATE
USING (user_id = auth.uid () OR public.is_platform_admin ())
WITH CHECK (user_id = auth.uid () OR public.is_platform_admin ());

-- =============================================================================
-- 3. User notification preferences (6 toggles)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  notify_message_announcement boolean NOT NULL DEFAULT true,
  notify_message_initiative boolean NOT NULL DEFAULT true,
  notify_message_event boolean NOT NULL DEFAULT true,
  notify_new_announcement boolean NOT NULL DEFAULT false,
  notify_new_initiative boolean NOT NULL DEFAULT false,
  notify_new_event boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now (),
  updated_at timestamptz NOT NULL DEFAULT now ()
);

DROP TRIGGER IF EXISTS trg_user_notification_preferences_updated_at ON public.user_notification_preferences;
CREATE TRIGGER trg_user_notification_preferences_updated_at
BEFORE UPDATE ON public.user_notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at ();

ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_notification_preferences_select ON public.user_notification_preferences;
CREATE POLICY user_notification_preferences_select ON public.user_notification_preferences
FOR SELECT
USING (user_id = auth.uid () OR public.is_platform_admin ());

DROP POLICY IF EXISTS user_notification_preferences_insert ON public.user_notification_preferences;
CREATE POLICY user_notification_preferences_insert ON public.user_notification_preferences
FOR INSERT
WITH CHECK (user_id = auth.uid ());

DROP POLICY IF EXISTS user_notification_preferences_update ON public.user_notification_preferences;
CREATE POLICY user_notification_preferences_update ON public.user_notification_preferences
FOR UPDATE
USING (user_id = auth.uid ())
WITH CHECK (user_id = auth.uid ());

DROP POLICY IF EXISTS user_notification_preferences_delete ON public.user_notification_preferences;
CREATE POLICY user_notification_preferences_delete ON public.user_notification_preferences
FOR DELETE
USING (user_id = auth.uid () OR public.is_platform_admin ());

-- =============================================================================
-- 4. Push subscriptions registry (Web Push API)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now (),
  last_used_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user
ON public.push_subscriptions (user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS push_subscriptions_select ON public.push_subscriptions;
CREATE POLICY push_subscriptions_select ON public.push_subscriptions
FOR SELECT
USING (user_id = auth.uid () OR public.is_platform_admin ());

DROP POLICY IF EXISTS push_subscriptions_insert ON public.push_subscriptions;
CREATE POLICY push_subscriptions_insert ON public.push_subscriptions
FOR INSERT
WITH CHECK (user_id = auth.uid ());

DROP POLICY IF EXISTS push_subscriptions_delete ON public.push_subscriptions;
CREATE POLICY push_subscriptions_delete ON public.push_subscriptions
FOR DELETE
USING (user_id = auth.uid () OR public.is_platform_admin ());

-- =============================================================================
-- 5. RPC: list conversations for current user with enriched data
--     Returns: conversation row + other participant profile + unread count
--     This avoids N+1 from the client: 1 round-trip = full inbox list.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.list_my_conversations (
  p_commune_id uuid,
  p_archived boolean DEFAULT false
)
RETURNS TABLE (
  conversation_id uuid,
  context_type public.context_type,
  context_id uuid,
  title text,
  updated_at timestamptz,
  last_message_at timestamptz,
  last_message_preview text,
  last_message_sender_id uuid,
  archived_at timestamptz,
  last_read_at timestamptz,
  other_user_id uuid,
  other_display_name text,
  other_avatar_url text,
  unread_count integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH my AS (
    SELECT cp.conversation_id, cp.archived_at, cp.last_read_at
    FROM public.conversation_participants cp
    WHERE cp.user_id = auth.uid()
      AND (
        (p_archived = false AND cp.archived_at IS NULL)
        OR (p_archived = true AND cp.archived_at IS NOT NULL AND cp.archived_at > now() - interval '30 days')
      )
  )
  SELECT
    c.id AS conversation_id,
    c.context_type,
    c.context_id,
    c.title,
    c.updated_at,
    c.last_message_at,
    c.last_message_preview,
    c.last_message_sender_id,
    my.archived_at,
    my.last_read_at,
    CASE WHEN c.participant_a = auth.uid() THEN c.participant_b ELSE c.participant_a END AS other_user_id,
    p.display_name AS other_display_name,
    p.avatar_url AS other_avatar_url,
    (
      SELECT count(*)::int
      FROM public.messages m
      WHERE m.conversation_id = c.id
        AND m.sender_id <> auth.uid()
        AND (my.last_read_at IS NULL OR m.created_at > my.last_read_at)
    ) AS unread_count
  FROM my
  INNER JOIN public.conversations c ON c.id = my.conversation_id
  LEFT JOIN public.profiles p
    ON p.user_id = (
      CASE WHEN c.participant_a = auth.uid() THEN c.participant_b ELSE c.participant_a END
    )
  WHERE c.commune_id = p_commune_id
  ORDER BY c.last_message_at DESC NULLS LAST, c.updated_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.list_my_conversations (uuid, boolean) TO authenticated;

COMMIT;
