-- Content outcomes: track whether deleted announcements/events were successful.

BEGIN;

CREATE TYPE public.content_kind AS ENUM ('announcement', 'event');
CREATE TYPE public.outcome_reason AS ENUM ('fulfilled', 'unfulfilled');

CREATE TABLE public.content_outcomes (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  commune_id    uuid NOT NULL REFERENCES public.communes(id) ON DELETE CASCADE,
  membership_id uuid REFERENCES public.memberships(id) ON DELETE SET NULL,
  content_kind  public.content_kind NOT NULL,
  content_type  text,
  category_slug text NOT NULL,
  outcome       public.outcome_reason NOT NULL,
  recorded_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.content_outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY content_outcomes_insert ON public.content_outcomes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_active_membership(commune_id)
    AND membership_id IN (
      SELECT m.id
      FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.commune_id = content_outcomes.commune_id
        AND m.status = 'active'
    )
  );

CREATE POLICY content_outcomes_select_staff ON public.content_outcomes
  FOR SELECT
  TO authenticated
  USING (
    public.is_platform_admin()
    OR public.is_municipality_staff_for_commune(commune_id)
  );

CREATE INDEX idx_outcomes_commune_recorded
  ON public.content_outcomes (commune_id, recorded_at DESC);

CREATE INDEX idx_outcomes_commune_kind_outcome
  ON public.content_outcomes (commune_id, content_kind, outcome);

CREATE OR REPLACE FUNCTION public.commune_fulfilled_demands_this_week(p_commune_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_active_membership(p_commune_id) THEN
    RETURN 0;
  END IF;

  RETURN (
    SELECT count(*)::integer
    FROM public.content_outcomes co
    WHERE co.commune_id = p_commune_id
      AND co.content_kind = 'announcement'
      AND co.content_type = 'demande'
      AND co.outcome = 'fulfilled'
      AND co.recorded_at >= (
        date_trunc('week', now() AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'Europe/Paris'
      )
  );
END;
$$;

GRANT SELECT, INSERT ON public.content_outcomes TO authenticated;
GRANT ALL ON public.content_outcomes TO service_role;
GRANT EXECUTE ON FUNCTION public.commune_fulfilled_demands_this_week(uuid) TO authenticated;

COMMIT;
