-- Import script uses service_role; table needs explicit grants (RLS alone is not enough).

BEGIN;

GRANT SELECT ON public.prospect_communes TO authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON public.prospect_communes TO service_role;

COMMIT;
