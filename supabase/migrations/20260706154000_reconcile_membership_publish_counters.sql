-- Reconcile denormalized publish counters from source tables.
-- Events: exclude official municipality events (is_official = true).

UPDATE public.memberships
SET
  total_announcements_published = 0,
  total_initiatives_published = 0,
  total_events_published = 0;

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
  WHERE is_official = false
  GROUP BY author_membership_id
) sub
WHERE m.id = sub.author_membership_id;
