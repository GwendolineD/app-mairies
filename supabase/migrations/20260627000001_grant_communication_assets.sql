-- communication_assets was created after the baseline GRANT ON ALL TABLES;
-- explicit grants are required for authenticated/service_role access.

GRANT SELECT ON public.communication_assets TO authenticated, service_role;

GRANT INSERT, UPDATE, DELETE ON public.communication_assets TO authenticated, service_role;
