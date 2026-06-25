-- Rename legacy "Vie Locale" brand strings to "Tous Voisins" in stored user-facing content.

-- 1. Platform email templates
UPDATE public.email_templates
SET
  subject = replace(subject, 'Vie Locale', 'Tous Voisins'),
  body_html = replace(body_html, 'Vie Locale', 'Tous Voisins')
WHERE subject LIKE '%Vie Locale%' OR body_html LIKE '%Vie Locale%';

-- 2. neighbor-invite CTA: use {{app_name}} (injected at send time)
UPDATE public.email_templates
SET body_html = replace(body_html, 'Rejoindre Tous Voisins', 'Rejoindre {{app_name}}')
WHERE slug = 'neighbor-invite';

-- 3. trial-invitation subject: use {{app_name}}
UPDATE public.email_templates
SET subject = replace(subject, 'sur Tous Voisins', 'sur {{app_name}}')
WHERE slug = 'trial-invitation';

-- 4. Legacy per-commune email templates
UPDATE public.commune_email_templates
SET
  subject = replace(subject, 'Vie Locale', 'Tous Voisins'),
  body_markdown = replace(body_markdown, 'Vie Locale', 'Tous Voisins'),
  cta_label = replace(cta_label, 'Vie Locale', 'Tous Voisins')
WHERE subject LIKE '%Vie Locale%'
   OR body_markdown LIKE '%Vie Locale%'
   OR cta_label LIKE '%Vie Locale%';

ALTER TABLE public.commune_email_templates
  ALTER COLUMN cta_label SET DEFAULT 'Rejoindre Tous Voisins';

-- 5. Commune welcome messages
UPDATE public.communes
SET settings = jsonb_set(
  settings,
  '{welcomeMessage}',
  to_jsonb(replace(settings->>'welcomeMessage', 'Vie Locale', 'Tous Voisins'))
)
WHERE settings->>'welcomeMessage' LIKE '%Vie Locale%';
