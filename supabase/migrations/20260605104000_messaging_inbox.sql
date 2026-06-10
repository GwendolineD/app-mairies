-- =============================================================================
-- Messaging read-side aggregation.
-- Single round-trip RPCs that build the inbox (other participant + last message
-- + unread count) and the unread badge, avoiding N+1 queries from the app.
-- Both are SECURITY DEFINER but strictly scoped to auth.uid() so callers only
-- ever see their own conversations.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_conversation_inbox (p_commune_id uuid)
RETURNS TABLE (
  conversation_id uuid,
  title text,
  context_type public.context_type,
  context_id uuid,
  updated_at timestamptz,
  other_user_id uuid,
  other_display_name text,
  other_first_name text,
  other_last_name text,
  other_avatar_url text,
  last_message_body text,
  last_message_created_at timestamptz,
  last_message_sender_id uuid,
  unread_count integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH my_convos AS (
    SELECT c.id, c.title, c.context_type, c.context_id, c.updated_at, cp.last_read_at
    FROM public.conversations c
    JOIN public.conversation_participants cp
      ON cp.conversation_id = c.id AND cp.user_id = auth.uid ()
    WHERE c.commune_id = p_commune_id
  ),
  other AS (
    SELECT DISTINCT ON (cp.conversation_id)
      cp.conversation_id, p.user_id, p.display_name, p.first_name, p.last_name, p.avatar_url
    FROM public.conversation_participants cp
    JOIN public.profiles p ON p.user_id = cp.user_id
    WHERE cp.conversation_id IN (SELECT id FROM my_convos)
      AND cp.user_id <> auth.uid ()
    ORDER BY cp.conversation_id, cp.joined_at
  ),
  last_msg AS (
    SELECT DISTINCT ON (m.conversation_id)
      m.conversation_id, m.body, m.created_at, m.sender_id
    FROM public.messages m
    WHERE m.conversation_id IN (SELECT id FROM my_convos)
    ORDER BY m.conversation_id, m.created_at DESC
  ),
  unread AS (
    SELECT m.conversation_id, count(*)::int AS cnt
    FROM public.messages m
    JOIN my_convos mc ON mc.id = m.conversation_id
    WHERE m.sender_id <> auth.uid ()
      AND m.created_at > coalesce(mc.last_read_at, '-infinity'::timestamptz)
    GROUP BY m.conversation_id
  )
  SELECT
    mc.id, mc.title, mc.context_type, mc.context_id, mc.updated_at,
    o.user_id, o.display_name, o.first_name, o.last_name, o.avatar_url,
    lm.body, lm.created_at, lm.sender_id,
    coalesce(u.cnt, 0)
  FROM my_convos mc
  LEFT JOIN other o ON o.conversation_id = mc.id
  LEFT JOIN last_msg lm ON lm.conversation_id = mc.id
  LEFT JOIN unread u ON u.conversation_id = mc.id
  ORDER BY mc.updated_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_conversation_inbox (uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_unread_message_count (p_commune_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(count(*), 0)::int
  FROM public.messages m
  JOIN public.conversations c ON c.id = m.conversation_id
  JOIN public.conversation_participants cp
    ON cp.conversation_id = c.id AND cp.user_id = auth.uid ()
  WHERE c.commune_id = p_commune_id
    AND m.sender_id <> auth.uid ()
    AND m.created_at > coalesce(cp.last_read_at, '-infinity'::timestamptz);
$$;

GRANT EXECUTE ON FUNCTION public.get_unread_message_count (uuid) TO authenticated;
