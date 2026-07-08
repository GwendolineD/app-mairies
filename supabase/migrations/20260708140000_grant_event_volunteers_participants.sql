-- Grant authenticated role access to event_volunteers and event_participants tables.
-- These tables were created in 20260621000000 but missing explicit GRANT statements.

GRANT SELECT, INSERT, DELETE ON public.event_volunteers TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.event_participants TO authenticated;
