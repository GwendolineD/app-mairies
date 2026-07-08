-- Account deletion support:
-- - Preserve conversation history when a user is deleted (SET NULL on FKs)
-- - Archive deleted membership dates for dashboard stats
-- - Extend list_my_conversations for deleted-account UX
-- - Include archived memberships in commune_dashboard_monthly

BEGIN;

-- =============================================================================
-- 1. Change auth.users FKs on messages and conversations from CASCADE to SET NULL
-- =============================================================================

ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE public.messages ALTER COLUMN sender_id DROP NOT NULL;
ALTER TABLE public.messages
  ADD CONSTRAINT messages_sender_id_fkey
  FOREIGN KEY (sender_id) REFERENCES auth.users (id) ON DELETE SET NULL;

ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_created_by_user_id_fkey;
ALTER TABLE public.conversations ALTER COLUMN created_by_user_id DROP NOT NULL;
ALTER TABLE public.conversations
  ADD CONSTRAINT conversations_created_by_user_id_fkey
  FOREIGN KEY (created_by_user_id) REFERENCES auth.users (id) ON DELETE SET NULL;

ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_participant_a_fkey;
ALTER TABLE public.conversations
  ADD CONSTRAINT conversations_participant_a_fkey
  FOREIGN KEY (participant_a) REFERENCES auth.users (id) ON DELETE SET NULL;

ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_participant_b_fkey;
ALTER TABLE public.conversations
  ADD CONSTRAINT conversations_participant_b_fkey
  FOREIGN KEY (participant_b) REFERENCES auth.users (id) ON DELETE SET NULL;

-- =============================================================================
-- 2. Archive table for historical membership stats
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.deleted_membership_archive (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  commune_id uuid NOT NULL REFERENCES public.communes (id) ON DELETE CASCADE,
  original_created_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_deleted_archive_commune
  ON public.deleted_membership_archive (commune_id, original_created_at);

ALTER TABLE public.deleted_membership_archive ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS deleted_archive_select ON public.deleted_membership_archive;
CREATE POLICY deleted_archive_select ON public.deleted_membership_archive FOR SELECT
  USING (
    public.is_platform_admin ()
    OR public.is_municipality_staff_for_commune (commune_id)
  );

GRANT SELECT ON public.deleted_membership_archive TO authenticated;
GRANT ALL ON public.deleted_membership_archive TO service_role;

-- =============================================================================
-- 3. list_my_conversations — COALESCE display name + other_account_deleted flag
-- =============================================================================

DROP FUNCTION IF EXISTS public.list_my_conversations (uuid, boolean);

CREATE FUNCTION public.list_my_conversations (
  p_commune_id uuid,
  p_archived boolean DEFAULT false
)
RETURNS TABLE (
  conversation_id uuid,
  context_type public.context_type,
  context_id uuid,
  title text,
  context_photo_url text,
  context_available boolean,
  context_status text,
  other_membership_status text,
  other_account_deleted boolean,
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
        OR (
          p_archived = true
          AND cp.archived_at IS NOT NULL
          AND cp.archived_at > now() - interval '30 days'
        )
      )
  )
  SELECT
    c.id AS conversation_id,
    c.context_type,
    c.context_id,
    c.title,
    COALESCE(
      CASE
        WHEN c.context_type = 'announcement' THEN (
          SELECT a.photo_url FROM public.announcements a WHERE a.id = c.context_id
        )
      END,
      CASE
        WHEN c.context_type = 'initiative' THEN (
          SELECT i.photo_url FROM public.initiatives i WHERE i.id = c.context_id
        )
      END,
      CASE
        WHEN c.context_type = 'event' THEN (
          SELECT e.photo_url FROM public.events e WHERE e.id = c.context_id
        )
      END
    ) AS context_photo_url,
    CASE
      WHEN c.context_type IS NULL THEN true
      WHEN c.context_type = 'announcement' THEN (
        SELECT CASE
          WHEN NOT EXISTS (
            SELECT 1 FROM public.announcements a WHERE a.id = c.context_id
          ) THEN false
          WHEN EXISTS (
            SELECT 1
            FROM public.announcements a
            WHERE a.id = c.context_id
              AND a.suspended_at IS NOT NULL
          ) THEN false
          ELSE true
        END
      )
      WHEN c.context_type = 'initiative' THEN (
        SELECT CASE
          WHEN NOT EXISTS (
            SELECT 1 FROM public.initiatives i WHERE i.id = c.context_id
          ) THEN false
          WHEN EXISTS (
            SELECT 1
            FROM public.initiatives i
            WHERE i.id = c.context_id
              AND i.suspended_at IS NOT NULL
          ) THEN false
          ELSE true
        END
      )
      WHEN c.context_type = 'event' THEN (
        SELECT CASE
          WHEN NOT EXISTS (
            SELECT 1 FROM public.events e WHERE e.id = c.context_id
          ) THEN false
          WHEN EXISTS (
            SELECT 1
            FROM public.events e
            WHERE e.id = c.context_id
              AND e.suspended_at IS NOT NULL
          ) THEN false
          ELSE true
        END
      )
      ELSE true
    END AS context_available,
    CASE
      WHEN c.context_type IS NULL THEN NULL
      WHEN c.context_type = 'announcement' THEN (
        SELECT CASE
          WHEN NOT EXISTS (
            SELECT 1 FROM public.announcements a WHERE a.id = c.context_id
          ) THEN 'deleted'
          WHEN EXISTS (
            SELECT 1
            FROM public.announcements a
            WHERE a.id = c.context_id
              AND a.suspended_at IS NOT NULL
          ) THEN 'suspended'
          ELSE 'available'
        END
      )
      WHEN c.context_type = 'initiative' THEN (
        SELECT CASE
          WHEN NOT EXISTS (
            SELECT 1 FROM public.initiatives i WHERE i.id = c.context_id
          ) THEN 'deleted'
          WHEN EXISTS (
            SELECT 1
            FROM public.initiatives i
            WHERE i.id = c.context_id
              AND i.suspended_at IS NOT NULL
          ) THEN 'suspended'
          ELSE 'available'
        END
      )
      WHEN c.context_type = 'event' THEN (
        SELECT CASE
          WHEN NOT EXISTS (
            SELECT 1 FROM public.events e WHERE e.id = c.context_id
          ) THEN 'deleted'
          WHEN EXISTS (
            SELECT 1
            FROM public.events e
            WHERE e.id = c.context_id
              AND e.suspended_at IS NOT NULL
          ) THEN 'suspended'
          ELSE 'available'
        END
      )
      ELSE NULL
    END AS context_status,
    (
      SELECT m.status::text
      FROM public.memberships m
      WHERE m.user_id = (
        CASE
          WHEN c.participant_a = auth.uid() THEN c.participant_b
          ELSE c.participant_a
        END
      )
        AND m.commune_id = p_commune_id
      LIMIT 1
    ) AS other_membership_status,
    (
      CASE
        WHEN c.participant_a = auth.uid() THEN c.participant_b IS NULL
        ELSE c.participant_a IS NULL
      END
    ) AS other_account_deleted,
    c.updated_at,
    c.last_message_at,
    c.last_message_preview,
    c.last_message_sender_id,
    my.archived_at,
    my.last_read_at,
    CASE
      WHEN c.participant_a = auth.uid() THEN c.participant_b
      ELSE c.participant_a
    END AS other_user_id,
    CASE
      WHEN (
        CASE
          WHEN c.participant_a = auth.uid() THEN c.participant_b
          ELSE c.participant_a
        END
      ) IS NULL THEN 'Ancien voisin'
      ELSE COALESCE(p.display_name, 'Ancien voisin')
    END AS other_display_name,
    p.avatar_url AS other_avatar_url,
    (
      SELECT count(*)::int
      FROM public.messages m
      WHERE m.conversation_id = c.id
        AND m.sender_id IS NOT NULL
        AND m.sender_id <> auth.uid()
        AND (my.last_read_at IS NULL OR m.created_at > my.last_read_at)
    ) AS unread_count
  FROM my
  INNER JOIN public.conversations c ON c.id = my.conversation_id
  LEFT JOIN public.profiles p
    ON p.user_id = (
      CASE
        WHEN c.participant_a = auth.uid() THEN c.participant_b
        ELSE c.participant_a
      END
    )
  WHERE c.commune_id = p_commune_id
  ORDER BY c.last_message_at DESC NULLS LAST, c.updated_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.list_my_conversations (uuid, boolean) TO authenticated;

-- =============================================================================
-- 4. commune_dashboard_monthly — include archived deleted memberships
-- =============================================================================

CREATE OR REPLACE FUNCTION public.commune_dashboard_monthly (p_commune_id uuid)
RETURNS TABLE (
  month date,
  new_members bigint,
  demandes bigint,
  offres bigint,
  initiatives bigint,
  events bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH bounds AS (
    SELECT
      date_trunc('month', c.created_at)::date AS start_month,
      date_trunc('month', now())::date AS end_month
    FROM public.communes c
    WHERE c.id = p_commune_id
      AND (
        public.is_municipality_staff_for_commune (p_commune_id)
        OR public.is_platform_admin ()
      )
  ),
  months AS (
    SELECT generate_series(b.start_month, b.end_month, interval '1 month')::date AS month
    FROM bounds b
  ),
  mem AS (
    SELECT date_trunc('month', created_at)::date AS month, count(*) AS n
    FROM public.memberships
    WHERE commune_id = p_commune_id
    GROUP BY 1
    UNION ALL
    SELECT date_trunc('month', original_created_at)::date AS month, count(*) AS n
    FROM public.deleted_membership_archive
    WHERE commune_id = p_commune_id
    GROUP BY 1
  ),
  mem_agg AS (
    SELECT month, sum(n) AS n
    FROM mem
    GROUP BY 1
  ),
  ann AS (
    SELECT
      date_trunc('month', created_at)::date AS month,
      count(*) FILTER (WHERE type = 'demande') AS demandes,
      count(*) FILTER (WHERE type = 'offre') AS offres
    FROM public.announcements
    WHERE commune_id = p_commune_id
    GROUP BY 1
  ),
  ini AS (
    SELECT date_trunc('month', created_at)::date AS month, count(*) AS n
    FROM public.initiatives
    WHERE commune_id = p_commune_id
    GROUP BY 1
  ),
  evt AS (
    SELECT date_trunc('month', created_at)::date AS month, count(*) AS n
    FROM public.events
    WHERE commune_id = p_commune_id
    GROUP BY 1
  )
  SELECT
    m.month,
    COALESCE(mem_agg.n, 0)::bigint AS new_members,
    COALESCE(ann.demandes, 0)::bigint AS demandes,
    COALESCE(ann.offres, 0)::bigint AS offres,
    COALESCE(ini.n, 0)::bigint AS initiatives,
    COALESCE(evt.n, 0)::bigint AS events
  FROM months m
  LEFT JOIN mem_agg ON mem_agg.month = m.month
  LEFT JOIN ann ON ann.month = m.month
  LEFT JOIN ini ON ini.month = m.month
  LEFT JOIN evt ON evt.month = m.month
  ORDER BY m.month;
$$;

COMMIT;
