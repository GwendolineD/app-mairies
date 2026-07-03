-- Lightweight unread badge RPC + performance indexes (audit P1)

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
        AND m.sender_id <> auth.uid()
        AND (cp.last_read_at IS NULL OR m.created_at > cp.last_read_at)
    )
  ), 0)::int
  FROM public.conversations c
  INNER JOIN public.conversation_participants cp
    ON cp.conversation_id = c.id
  WHERE cp.user_id = auth.uid()
    AND c.commune_id = p_commune_id
    AND cp.archived_at IS NULL;
$$;

GRANT EXECUTE ON FUNCTION public.count_total_unread(uuid) TO authenticated;

CREATE INDEX IF NOT EXISTS idx_memberships_commune_status
  ON public.memberships (commune_id, status);

CREATE INDEX IF NOT EXISTS idx_announcements_commune_target_date
  ON public.announcements (commune_id, target_date);

CREATE INDEX IF NOT EXISTS idx_announcements_commune_category
  ON public.announcements (commune_id, category_slug);

CREATE INDEX IF NOT EXISTS idx_announcements_author_membership
  ON public.announcements (author_membership_id);

CREATE INDEX IF NOT EXISTS idx_initiatives_author_membership
  ON public.initiatives (author_membership_id);

CREATE INDEX IF NOT EXISTS idx_events_author_membership
  ON public.events (author_membership_id);
