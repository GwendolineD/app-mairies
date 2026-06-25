-- initiative_event_categories was created after the baseline GRANT ON ALL TABLES;
-- explicit grants are required for authenticated admin writes (RLS still applies).

GRANT SELECT, INSERT, UPDATE, DELETE ON public.initiative_event_categories TO authenticated;
GRANT ALL ON public.initiative_event_categories TO postgres, service_role;
