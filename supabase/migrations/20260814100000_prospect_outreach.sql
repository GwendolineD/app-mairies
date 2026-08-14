-- Prospect outreach CRM (1:1 with prospect_communes)

BEGIN;

CREATE TYPE public.prospect_outreach_status AS ENUM (
  'not_contacted',
  'in_progress',
  'completed'
);

CREATE TYPE public.prospect_first_contact_type AS ENUM (
  'email',
  'sms',
  'call',
  'in_person'
);

CREATE TYPE public.prospect_outcome AS ENUM (
  'abandon',
  'refusal',
  'adhesion',
  'reflection'
);

CREATE TABLE public.prospect_outreach (
  prospect_commune_id uuid PRIMARY KEY
    REFERENCES public.prospect_communes (id) ON DELETE CASCADE,
  status public.prospect_outreach_status NOT NULL DEFAULT 'not_contacted',
  outcome public.prospect_outcome,
  first_contact_at timestamptz,
  first_contact_type public.prospect_first_contact_type,
  visit_1_at date,
  visit_2_at date,
  council_demo_at date,
  commerce_count integer CHECK (commerce_count IS NULL OR commerce_count >= 0),
  association_count integer CHECK (association_count IS NULL OR association_count >= 0),
  notes_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT prospect_outreach_completed_outcome_check CHECK (
    (status = 'completed' AND outcome IS NOT NULL)
    OR (status <> 'completed' AND outcome IS NULL)
  )
);

CREATE INDEX idx_prospect_outreach_status ON public.prospect_outreach (status);
CREATE INDEX idx_prospect_outreach_visit_1_at ON public.prospect_outreach (visit_1_at);
CREATE INDEX idx_prospect_outreach_first_contact_at ON public.prospect_outreach (first_contact_at);

INSERT INTO public.prospect_outreach (prospect_commune_id, status)
SELECT id, 'not_contacted'::public.prospect_outreach_status
FROM public.prospect_communes
ON CONFLICT (prospect_commune_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.create_prospect_outreach_for_commune()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.prospect_outreach (prospect_commune_id, status)
  VALUES (NEW.id, 'not_contacted')
  ON CONFLICT (prospect_commune_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prospect_communes_create_outreach
AFTER INSERT ON public.prospect_communes
FOR EACH ROW
EXECUTE FUNCTION public.create_prospect_outreach_for_commune();

CREATE TRIGGER trg_prospect_outreach_updated_at
BEFORE UPDATE ON public.prospect_outreach
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.prospect_outreach ENABLE ROW LEVEL SECURITY;

CREATE POLICY prospect_outreach_select ON public.prospect_outreach
FOR SELECT
USING (public.is_platform_admin());

CREATE POLICY prospect_outreach_insert ON public.prospect_outreach
FOR INSERT
WITH CHECK (public.is_platform_admin());

CREATE POLICY prospect_outreach_update ON public.prospect_outreach
FOR UPDATE
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

CREATE POLICY prospect_communes_update ON public.prospect_communes
FOR UPDATE
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

COMMIT;
