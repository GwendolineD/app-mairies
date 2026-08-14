-- Subject 9 phase 2: wrap auth.uid() in active messaging RPCs; drop unused legacy RPCs.

DROP FUNCTION IF EXISTS public.get_conversation_inbox(uuid);
DROP FUNCTION IF EXISTS public.get_unread_message_count(uuid);
DROP FUNCTION IF EXISTS public.get_or_create_context_conversation(public.context_type, uuid);

CREATE OR REPLACE FUNCTION public.count_total_unread(p_commune_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(sum(
    (
      SELECT count(*)::int
      FROM public.messages m
      WHERE m.conversation_id = c.id
        AND m.sender_id <> (select auth.uid())
        AND (cp.last_read_at IS NULL OR m.created_at > cp.last_read_at)
    )
  ), 0)::int
  FROM public.conversations c
  INNER JOIN public.conversation_participants cp
    ON cp.conversation_id = c.id
  WHERE cp.user_id = (select auth.uid())
    AND c.commune_id = p_commune_id
    AND cp.archived_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION public.increment_membership_counter(
  p_membership_id uuid,
  p_column_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_column_name NOT IN (
    'total_announcements_published',
    'total_initiatives_published',
    'total_events_published'
  ) THEN
    RAISE EXCEPTION 'Invalid counter column: %', p_column_name;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE id = p_membership_id AND user_id = (select auth.uid())
  ) THEN
    RAISE EXCEPTION 'Membership does not belong to caller';
  END IF;

  EXECUTE format(
    'UPDATE public.memberships SET %I = %I + 1 WHERE id = $1',
    p_column_name, p_column_name
  ) USING p_membership_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_my_conversations (
  p_commune_id uuid,
  p_archived boolean DEFAULT false,
  p_limit int DEFAULT 30,
  p_offset int DEFAULT 0
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
  unread_count integer,
  total_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH _auth AS (
    SELECT auth.uid() AS uid
  ),
  my AS (
    SELECT cp.conversation_id, cp.archived_at, cp.last_read_at
    FROM public.conversation_participants cp
    WHERE cp.user_id = (SELECT uid FROM _auth)
      AND (
        (p_archived = false AND cp.archived_at IS NULL)
        OR (
          p_archived = true
          AND cp.archived_at IS NOT NULL
          AND cp.archived_at > now() - interval '30 days'
        )
      )
  ),
  ranked AS (
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
            WHEN c.participant_a = (SELECT uid FROM _auth) THEN c.participant_b
            ELSE c.participant_a
          END
        )
          AND m.commune_id = p_commune_id
        LIMIT 1
      ) AS other_membership_status,
      (
        CASE
          WHEN c.participant_a = (SELECT uid FROM _auth) THEN c.participant_b IS NULL
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
        WHEN c.participant_a = (SELECT uid FROM _auth) THEN c.participant_b
        ELSE c.participant_a
      END AS other_user_id,
      CASE
        WHEN (
          CASE
            WHEN c.participant_a = (SELECT uid FROM _auth) THEN c.participant_b
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
          AND m.sender_id <> (SELECT uid FROM _auth)
          AND (my.last_read_at IS NULL OR m.created_at > my.last_read_at)
      ) AS unread_count
    FROM my
    INNER JOIN public.conversations c ON c.id = my.conversation_id
    LEFT JOIN public.profiles p
      ON p.user_id = (
        CASE
          WHEN c.participant_a = (SELECT uid FROM _auth) THEN c.participant_b
          ELSE c.participant_a
        END
      )
    WHERE c.commune_id = p_commune_id
    ORDER BY c.last_message_at DESC NULLS LAST, c.updated_at DESC
  )
  SELECT
    ranked.*,
    count(*) OVER () AS total_count
  FROM ranked
  LIMIT p_limit
  OFFSET p_offset;
$$;

GRANT EXECUTE ON FUNCTION public.count_total_unread(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_membership_counter(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_my_conversations(uuid, boolean, int, int) TO authenticated;
