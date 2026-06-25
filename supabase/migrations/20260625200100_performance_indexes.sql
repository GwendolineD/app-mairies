-- Performance indexes for P1 hot paths (reports, event volunteers/participants, initiative responses, events by end date).

CREATE INDEX IF NOT EXISTS idx_reports_commune_created
  ON public.reports (commune_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_volunteers_event
  ON public.event_volunteers (event_id);

CREATE INDEX IF NOT EXISTS idx_event_participants_event
  ON public.event_participants (event_id);

CREATE INDEX IF NOT EXISTS idx_initiative_responses_initiative_type
  ON public.initiative_responses (initiative_id, response_type);

CREATE INDEX IF NOT EXISTS idx_events_commune_ends
  ON public.events (commune_id, ends_at DESC);
