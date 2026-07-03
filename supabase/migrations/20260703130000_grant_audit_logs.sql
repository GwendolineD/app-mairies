-- audit_logs was created after baseline GRANT ON ALL TABLES;
-- service_role needs INSERT for logAudit(); authenticated needs SELECT for backoffice (RLS).

BEGIN;

GRANT INSERT ON public.audit_logs TO service_role;
GRANT SELECT ON public.audit_logs TO authenticated, service_role;

COMMIT;
