-- Event engagement guests: let a member register to an event (as participant
-- or volunteer) together with N anonymous companions. Guests have no account
-- and no name: only a count is stored on the member's own registration row.
--
-- Headcount = count(rows) + sum(guests_count); it is the public figure shown
-- everywhere ("12 personnes attendues"), while the raw row count is only
-- used internally for list pagination.

-- =============================================================================
-- 1. guests_count columns (constant default: no table rewrite on PG >= 11)
-- =============================================================================

ALTER TABLE public.event_participants
  ADD COLUMN guests_count integer NOT NULL DEFAULT 0
  CONSTRAINT event_participants_guests_count_range CHECK (guests_count BETWEEN 0 AND 10);

ALTER TABLE public.event_volunteers
  ADD COLUMN guests_count integer NOT NULL DEFAULT 0
  CONSTRAINT event_volunteers_guests_count_range CHECK (guests_count BETWEEN 0 AND 10);

-- =============================================================================
-- 2. UPDATE policies + grants (needed by the upsert that edits guests_count).
--    The commune-membership trigger already fires on UPDATE.
-- =============================================================================

CREATE POLICY event_participants_update ON public.event_participants FOR UPDATE
USING (public.owns_active_membership (membership_id))
WITH CHECK (public.owns_active_membership (membership_id));

CREATE POLICY event_volunteers_update ON public.event_volunteers FOR UPDATE
USING (public.owns_active_membership (membership_id))
WITH CHECK (public.owns_active_membership (membership_id));

GRANT UPDATE ON public.event_participants TO authenticated;
GRANT UPDATE ON public.event_volunteers TO authenticated;

-- =============================================================================
-- 3. count_event_participation: add headcount columns.
--    RETURNS TABLE cannot change through CREATE OR REPLACE -> drop + recreate,
--    then re-grant (grants are dropped with the function).
-- =============================================================================

DROP FUNCTION IF EXISTS public.count_event_participation (uuid[]);

CREATE FUNCTION public.count_event_participation (p_event_ids uuid[])
RETURNS TABLE (
  event_id uuid,
  volunteers_count bigint,
  volunteers_headcount bigint,
  participants_count bigint,
  participants_headcount bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.id AS event_id,
    COALESCE(v.cnt, 0) AS volunteers_count,
    COALESCE(v.headcount, 0) AS volunteers_headcount,
    COALESCE(p.cnt, 0) AS participants_count,
    COALESCE(p.headcount, 0) AS participants_headcount
  FROM unnest(p_event_ids) AS e (id)
  LEFT JOIN (
    SELECT
      ev.event_id,
      count(*) AS cnt,
      count(*) + COALESCE(sum(ev.guests_count), 0) AS headcount
    FROM public.event_volunteers ev
    WHERE ev.event_id = ANY (p_event_ids)
    GROUP BY ev.event_id
  ) v ON v.event_id = e.id
  LEFT JOIN (
    SELECT
      ep.event_id,
      count(*) AS cnt,
      count(*) + COALESCE(sum(ep.guests_count), 0) AS headcount
    FROM public.event_participants ep
    WHERE ep.event_id = ANY (p_event_ids)
    GROUP BY ep.event_id
  ) p ON p.event_id = e.id;
$$;

GRANT EXECUTE ON FUNCTION public.count_event_participation (uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_event_participation (uuid[]) TO service_role;
