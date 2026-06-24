-- support_requests was created after the baseline GRANT ON ALL TABLES;
-- explicit grants are required for authenticated/service_role PostgREST access.

GRANT USAGE ON TYPE public.support_request_status TO authenticated, service_role;

GRANT SELECT, INSERT, UPDATE ON public.support_requests TO authenticated, service_role;
