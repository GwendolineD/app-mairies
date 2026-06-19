-- Grant SELECT on email_templates to all roles so that any code path
-- (service client, authenticated user, or anon) can read templates.
-- service_role bypasses RLS but still requires explicit GRANTs.

GRANT SELECT ON public.email_templates TO service_role, authenticated, anon;
