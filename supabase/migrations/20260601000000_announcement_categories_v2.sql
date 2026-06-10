-- Announcement categories v2: 12 categories with updated slugs and labels

INSERT INTO public.announcement_categories (slug, label, sort_order, icon_url, map_pin_url)
VALUES
  ('transport', 'Transport', 3, null, null),
  ('paperasse', 'Paperasse', 6, null, null),
  ('jardinage-exterieur', 'Jardinage & extérieur', 8, null, null),
  ('loisirs', 'Loisirs', 11, null, null),
  ('autre', 'Autre', 12, null, null)
ON CONFLICT (slug) DO UPDATE SET
  label = excluded.label,
  sort_order = excluded.sort_order;

UPDATE public.announcements SET category_slug = 'transport' WHERE category_slug = 'covoiturage';
UPDATE public.announcements SET category_slug = 'paperasse' WHERE category_slug = 'administratif';
UPDATE public.announcements SET category_slug = 'jardinage-exterieur' WHERE category_slug = 'jardinage';
UPDATE public.announcements SET category_slug = 'autre' WHERE category_slug = 'autres';

UPDATE public.announcement_categories SET
  label = 'Bricolage',
  sort_order = 1
WHERE slug = 'bricolage';

UPDATE public.announcement_categories SET
  label = 'Numérique',
  sort_order = 2
WHERE slug = 'numerique';

UPDATE public.announcement_categories SET
  label = 'Alimentaire',
  sort_order = 4
WHERE slug = 'alimentaire';

UPDATE public.announcement_categories SET
  label = 'Garde ponctuelle',
  sort_order = 5
WHERE slug = 'garde-pontuelle';

UPDATE public.announcement_categories SET
  label = 'Animaux',
  sort_order = 7
WHERE slug = 'animaux';

UPDATE public.announcement_categories SET
  label = 'Prêt d''objet',
  sort_order = 9
WHERE slug = 'pret-objet';

UPDATE public.announcement_categories SET
  label = 'Don & troc',
  sort_order = 10
WHERE slug = 'don-troc';

DELETE FROM public.announcement_categories
WHERE slug IN ('covoiturage', 'administratif', 'jardinage', 'autres');
