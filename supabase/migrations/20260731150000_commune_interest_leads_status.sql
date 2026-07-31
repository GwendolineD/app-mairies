-- Staff review workflow for commune interest leads (backoffice nav badge + triage)

BEGIN;

ALTER TABLE public.commune_interest_leads
  ADD COLUMN status public.support_request_status NOT NULL DEFAULT 'new',
  ADD COLUMN admin_comment text,
  ADD COLUMN reviewed_at timestamptz,
  ADD COLUMN reviewed_by_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL;

CREATE INDEX idx_commune_interest_leads_status_created
  ON public.commune_interest_leads (status, created_at DESC);

CREATE POLICY commune_interest_leads_update ON public.commune_interest_leads
FOR UPDATE
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

-- Pre-existing rows were handled outside the tool; only new leads should count as open.
UPDATE public.commune_interest_leads
SET status = 'dismissed',
    reviewed_at = now()
WHERE created_at < now();

COMMIT;
