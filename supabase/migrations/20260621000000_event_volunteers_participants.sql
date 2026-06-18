-- Event volunteers & participants: dedicated tables instead of
-- piggybacking on initiative_responses with response_type='volunteer'.

-- =============================================================================
-- 1. event_volunteers
-- =============================================================================

CREATE TABLE public.event_volunteers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
  event_id uuid NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  membership_id uuid NOT NULL REFERENCES public.memberships (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now (),
  UNIQUE (event_id, membership_id)
);

ALTER TABLE public.event_volunteers ENABLE ROW LEVEL SECURITY;

-- Trigger: membership must be active in the event's commune
CREATE OR REPLACE FUNCTION public.enforce_event_volunteer_membership_commune ()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.memberships m
    INNER JOIN public.events e
      ON e.commune_id = m.commune_id
    WHERE m.id = NEW.membership_id
      AND e.id = NEW.event_id
      AND m.status = 'active'
  ) THEN
    RAISE EXCEPTION 'membership must be active membership in event commune';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_event_volunteers_validate
BEFORE INSERT OR UPDATE ON public.event_volunteers
FOR EACH ROW
EXECUTE FUNCTION public.enforce_event_volunteer_membership_commune ();

-- RLS policies
CREATE POLICY event_volunteers_select ON public.event_volunteers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_volunteers.event_id
      AND public.can_access_commune_content (e.commune_id)
  )
);

CREATE POLICY event_volunteers_insert ON public.event_volunteers FOR INSERT
WITH CHECK (
  public.owns_active_membership (membership_id)
  AND EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_volunteers.event_id
      AND public.can_access_commune_content (e.commune_id)
  )
);

CREATE POLICY event_volunteers_delete ON public.event_volunteers FOR DELETE
USING (
  public.is_platform_admin ()
  OR public.is_municipality_staff_for_commune (
      (SELECT e.commune_id FROM public.events e WHERE e.id = event_volunteers.event_id)
    )
  OR public.owns_active_membership (membership_id)
);

-- =============================================================================
-- 2. event_participants
-- =============================================================================

CREATE TABLE public.event_participants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
  event_id uuid NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  membership_id uuid NOT NULL REFERENCES public.memberships (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now (),
  UNIQUE (event_id, membership_id)
);

ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_event_participants_validate
BEFORE INSERT OR UPDATE ON public.event_participants
FOR EACH ROW
EXECUTE FUNCTION public.enforce_event_volunteer_membership_commune ();

-- RLS policies (same pattern as event_volunteers)
CREATE POLICY event_participants_select ON public.event_participants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_participants.event_id
      AND public.can_access_commune_content (e.commune_id)
  )
);

CREATE POLICY event_participants_insert ON public.event_participants FOR INSERT
WITH CHECK (
  public.owns_active_membership (membership_id)
  AND EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_participants.event_id
      AND public.can_access_commune_content (e.commune_id)
  )
);

CREATE POLICY event_participants_delete ON public.event_participants FOR DELETE
USING (
  public.is_platform_admin ()
  OR public.is_municipality_staff_for_commune (
      (SELECT e.commune_id FROM public.events e WHERE e.id = event_participants.event_id)
    )
  OR public.owns_active_membership (membership_id)
);

-- =============================================================================
-- 3. Migrate existing volunteer data from initiative_responses
-- =============================================================================

INSERT INTO public.event_volunteers (event_id, membership_id, created_at)
SELECT e.id, ir.membership_id, ir.created_at
FROM public.initiative_responses ir
JOIN public.events e ON e.source_initiative_id = ir.initiative_id
WHERE ir.response_type = 'volunteer'
ON CONFLICT DO NOTHING;

DELETE FROM public.initiative_responses WHERE response_type = 'volunteer';
