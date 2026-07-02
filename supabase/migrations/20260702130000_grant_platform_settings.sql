-- platform_settings was created after the initial schema-wide GRANT;
-- authenticated/anon roles need explicit table privileges (RLS still applies).

GRANT SELECT ON public.platform_settings TO anon, authenticated, service_role;
GRANT UPDATE ON public.platform_settings TO authenticated, service_role;

DROP POLICY IF EXISTS platform_settings_update ON public.platform_settings;

CREATE POLICY platform_settings_update ON public.platform_settings
  FOR UPDATE
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());
