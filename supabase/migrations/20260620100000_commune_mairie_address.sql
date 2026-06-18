-- Structured mairie address on communes (street, city, postcode, BAN coordinates)
ALTER TABLE public.communes
ADD COLUMN IF NOT EXISTS mairie_address_street text,
ADD COLUMN IF NOT EXISTS mairie_address_city text,
ADD COLUMN IF NOT EXISTS mairie_address_postcode text,
ADD COLUMN IF NOT EXISTS mairie_address_lat double precision,
ADD COLUMN IF NOT EXISTS mairie_address_lng double precision;

-- Best-effort backfill from legacy settings.address
UPDATE public.communes
SET mairie_address_street = NULLIF(trim(settings->>'address'), '')
WHERE mairie_address_street IS NULL
  AND NULLIF(trim(settings->>'address'), '') IS NOT NULL;

UPDATE public.communes
SET mairie_address_city = name
WHERE mairie_address_city IS NULL
  AND mairie_address_street IS NOT NULL;

UPDATE public.communes
SET mairie_address_postcode = postcode
WHERE mairie_address_postcode IS NULL
  AND mairie_address_street IS NOT NULL;

UPDATE public.communes
SET mairie_address_lat = centroid_lat,
    mairie_address_lng = centroid_lng
WHERE mairie_address_street IS NOT NULL
  AND mairie_address_lat IS NULL
  AND mairie_address_lng IS NULL;
