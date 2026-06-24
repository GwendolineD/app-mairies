-- Align platform support email with current brand contact address.

UPDATE public.platform_settings
SET support_email = 'contact@tous-voisins.fr'
WHERE id = 1
  AND support_email = 'contact@vielocale.fr';

ALTER TABLE public.platform_settings
  ALTER COLUMN support_email SET DEFAULT 'contact@tous-voisins.fr';
