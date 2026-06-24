-- legal_documents was created after the baseline GRANT ON ALL TABLES;
-- explicit grants are required for anon/authenticated/service_role access.

GRANT SELECT ON public.legal_documents TO anon, authenticated, service_role;

GRANT INSERT, UPDATE ON public.legal_documents TO authenticated, service_role;
