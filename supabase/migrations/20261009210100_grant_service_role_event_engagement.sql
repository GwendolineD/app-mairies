-- event_volunteers / event_participants were only granted to `authenticated`
-- (20260708140000). Align with the project convention of explicit grants to
-- service_role so server-side tooling and integration tests can read them.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_volunteers TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_participants TO service_role;
