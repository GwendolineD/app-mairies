-- Prospect communes for backoffice territorial prospection (platform admin read-only)

BEGIN;

CREATE TABLE public.prospect_communes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commune text NOT NULL,
  departement text NOT NULL,
  population integer NOT NULL CHECK (population >= 0),
  distance_km numeric(8, 2),
  maire text,
  conseillers jsonb NOT NULL DEFAULT '[]'::jsonb,
  nombre_elus integer,
  adresse_mairie text NOT NULL,
  postcode text,
  latitude double precision,
  longitude double precision,
  geocode_source text NOT NULL DEFAULT 'failed'
    CHECK (geocode_source IN ('ban', 'centroid', 'failed')),
  telephones text[] NOT NULL DEFAULT '{}'::text[],
  emails text[] NOT NULL DEFAULT '{}'::text[],
  horaires_ouverture text,
  opening_days text[] NOT NULL DEFAULT '{}'::text[],
  insee_code text,
  import_batch_id uuid,
  source_imported_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (commune, departement)
);

CREATE INDEX idx_prospect_communes_departement ON public.prospect_communes (departement);
CREATE INDEX idx_prospect_communes_postcode ON public.prospect_communes (postcode);
CREATE INDEX idx_prospect_communes_population ON public.prospect_communes (population);
CREATE INDEX idx_prospect_communes_insee_code ON public.prospect_communes (insee_code)
  WHERE insee_code IS NOT NULL;
CREATE INDEX idx_prospect_communes_coords ON public.prospect_communes (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX idx_prospect_communes_opening_days ON public.prospect_communes USING gin (opening_days);

ALTER TABLE public.prospect_communes ENABLE ROW LEVEL SECURITY;

CREATE POLICY prospect_communes_select ON public.prospect_communes
FOR SELECT
USING (public.is_platform_admin());

COMMIT;
