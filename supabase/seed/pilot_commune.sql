-- Pilot commune: Les Authieux (27220, Eure) — also applied via supabase/seed.sql on db reset
INSERT INTO public.communes (
  insee_code,
  name,
  postcode,
  department,
  centroid_lat,
  centroid_lng,
  subscription_status,
  settings
)
VALUES (
  '27027',
  'Les Authieux',
  '27220',
  'Eure',
  48.8978,
  1.2338,
  'active',
  jsonb_build_object(
    'welcomeMessage',
    'Bienvenue sur Vie Locale Les Authieux — découvrir, partager, s''entraider.'
  )
)
ON CONFLICT (insee_code) DO UPDATE SET
  name = excluded.name,
  postcode = excluded.postcode,
  department = excluded.department,
  centroid_lat = excluded.centroid_lat,
  centroid_lng = excluded.centroid_lng,
  subscription_status = excluded.subscription_status,
  settings = excluded.settings;
