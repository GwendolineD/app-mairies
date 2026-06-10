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

INSERT INTO public.commune_email_templates (
  commune_id,
  template_key,
  subject,
  preheader,
  body_markdown,
  cta_label
)
SELECT
  id,
  'neighbor_invite',
  '{{sender_name}} vous invite sur Vie Locale {{commune_name}}',
  'Un espace local pour découvrir les initiatives, partager des annonces et s''entraider entre voisins.',
  'Bonjour,

{{sender_name}} vous invite à rejoindre Vie Locale {{commune_name}}, l''espace convivial pour découvrir ce qui se passe près de chez vous, proposer un coup de main et rencontrer des voisins bienveillants.

En quelques minutes, vous pourrez voir les annonces utiles, les initiatives locales et les événements de la commune.

{{invite_link}}

À très vite sur Vie Locale !',
  'Rejoindre Vie Locale'
FROM public.communes
WHERE insee_code = '27027'
ON CONFLICT (commune_id, template_key) DO UPDATE SET
  subject = excluded.subject,
  preheader = excluded.preheader,
  body_markdown = excluded.body_markdown,
  cta_label = excluded.cta_label,
  updated_at = now();
