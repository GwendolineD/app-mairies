-- Migration: Add context_photo_url to list_my_conversations RPC
-- This allows displaying the announcement/initiative/event photo in the inbox list

BEGIN;

-- PostgreSQL cannot CREATE OR REPLACE when RETURNS TABLE changes; drop first.
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
    COALESCE(
      CASE WHEN c.context_type = 'announcement' THEN (SELECT photo_url FROM announcements WHERE id = c.context_id) END,
      CASE WHEN c.context_type = 'initiative' THEN (SELECT photo_url FROM initiatives WHERE id = c.context_id) END,
      CASE WHEN c.context_type = 'event' THEN (SELECT photo_url FROM events WHERE id = c.context_id) END
    ) AS context_photo_url,
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
