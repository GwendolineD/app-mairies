-- Allow platform admins to delete prospect communes from the backoffice UI.
-- prospect_outreach DELETE is required for ON DELETE CASCADE under RLS.

BEGIN;

GRANT DELETE ON public.prospect_communes TO authenticated;
GRANT DELETE ON public.prospect_outreach TO authenticated;

CREATE POLICY prospect_communes_delete ON public.prospect_communes
FOR DELETE
USING (public.is_platform_admin());

CREATE POLICY prospect_outreach_delete ON public.prospect_outreach
FOR DELETE
USING (public.is_platform_admin());

COMMIT;
