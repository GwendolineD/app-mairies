-- Add denormalized publish counters to memberships.
-- Incremented by the application on each successful creation.
-- Initialized from current row counts for existing data.

ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS total_announcements_published integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_initiatives_published integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_events_published integer NOT NULL DEFAULT 0;

-- RPC to safely increment a specific counter column by 1
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

  EXECUTE format(
    'UPDATE public.memberships SET %I = %I + 1 WHERE id = $1',
    p_column_name, p_column_name
  ) USING p_membership_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_membership_counter(uuid, text) TO authenticated;

-- Back-fill from existing data
UPDATE public.memberships m
SET total_announcements_published = sub.cnt
FROM (
  SELECT author_membership_id, count(*)::int AS cnt
  FROM public.announcements
  GROUP BY author_membership_id
) sub
WHERE m.id = sub.author_membership_id;

UPDATE public.memberships m
SET total_initiatives_published = sub.cnt
FROM (
  SELECT author_membership_id, count(*)::int AS cnt
  FROM public.initiatives
  GROUP BY author_membership_id
) sub
WHERE m.id = sub.author_membership_id;

UPDATE public.memberships m
SET total_events_published = sub.cnt
FROM (
  SELECT author_membership_id, count(*)::int AS cnt
  FROM public.events
  GROUP BY author_membership_id
) sub
WHERE m.id = sub.author_membership_id;
