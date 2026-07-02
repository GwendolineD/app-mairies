-- Add ownership check to increment_membership_counter RPC.
-- Prevents any authenticated user from inflating another user's publish counters.

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
    WHERE id = p_membership_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Membership does not belong to caller';
  END IF;

  EXECUTE format(
    'UPDATE public.memberships SET %I = %I + 1 WHERE id = $1',
    p_column_name, p_column_name
  ) USING p_membership_id;
END;
$$;
