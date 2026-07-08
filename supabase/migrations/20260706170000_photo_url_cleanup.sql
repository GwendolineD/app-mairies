-- Clear default category image URLs from content photo_url columns.
-- Default images are resolved client-side from category tables when photo_url IS NULL.

BEGIN;

UPDATE public.announcements a
SET photo_url = NULL
FROM public.announcement_categories c
WHERE a.category_slug = c.slug
  AND a.photo_url IS NOT NULL
  AND a.photo_url = c.default_image_url;

UPDATE public.initiatives i
SET photo_url = NULL
FROM public.initiative_event_categories c
WHERE i.category_slug = c.slug
  AND i.photo_url IS NOT NULL
  AND i.photo_url = c.default_image_url;

UPDATE public.events e
SET photo_url = NULL
FROM public.initiative_event_categories c
WHERE e.category_slug = c.slug
  AND e.photo_url IS NOT NULL
  AND e.photo_url = c.default_image_url;

COMMIT;
