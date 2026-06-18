-- Official municipality events (created from mairie admin space)
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS is_official boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_events_commune_official
ON public.events (commune_id, is_official)
WHERE is_official = true;
