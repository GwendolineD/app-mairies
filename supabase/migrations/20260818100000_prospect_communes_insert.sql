-- Allow platform admins to insert prospect communes from the backoffice UI.

BEGIN;

GRANT INSERT ON public.prospect_communes TO authenticated;

CREATE POLICY prospect_communes_insert ON public.prospect_communes
FOR INSERT
WITH CHECK (public.is_platform_admin());

COMMIT;
