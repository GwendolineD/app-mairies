-- Grants for prospect_outreach and UPDATE on prospect_communes (RLS restricts to platform admin)

BEGIN;

GRANT SELECT, INSERT, UPDATE ON public.prospect_outreach TO authenticated;
GRANT ALL ON public.prospect_outreach TO service_role;

GRANT UPDATE ON public.prospect_communes TO authenticated;

COMMIT;
