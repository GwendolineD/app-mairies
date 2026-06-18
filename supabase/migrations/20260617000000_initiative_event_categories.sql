-- Initiative/Event categories: shared table + initiatives photo_url + events category/source/volunteers

-- =============================================================================
-- 1. Create initiative_event_categories table
-- =============================================================================

CREATE TABLE public.initiative_event_categories (
  slug text PRIMARY KEY,
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  icon_name text,
  color_hex text NOT NULL DEFAULT '#A8A8A8',
  map_pin_url text,
  default_image_url text
);

ALTER TABLE public.initiative_event_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY initiative_event_categories_select_public
  ON public.initiative_event_categories FOR SELECT
  USING (auth.role () IN ('anon', 'authenticated'));

CREATE POLICY initiative_event_categories_write_admin
  ON public.initiative_event_categories FOR ALL
  USING (public.is_platform_admin ())
  WITH CHECK (public.is_platform_admin ());

GRANT SELECT ON public.initiative_event_categories TO anon;

-- =============================================================================
-- 2. Seed 12 categories with pins and default images
-- =============================================================================

INSERT INTO public.initiative_event_categories (slug, label, sort_order, icon_name, color_hex, map_pin_url, default_image_url)
VALUES
  ('solidarite', 'Solidarité', 1, 'heart-handshake', '#FF6B6B',
    'https://res.cloudinary.com/du3ko16j1/image/upload/v1781597749/app-mairies/illustrations/initiative-event-categories-pin/solidarite-small_eq7cem.png',
    'https://res.cloudinary.com/du3ko16j1/image/upload/v1781599350/app-mairies/illustrations/initiative-event-image-default/solidarite_-_Moyenne_xkxls9.png'),
  ('nature', 'Nature', 2, 'leaf', '#74E3B2',
    'https://res.cloudinary.com/du3ko16j1/image/upload/v1781597746/app-mairies/illustrations/initiative-event-categories-pin/nature-small_wd0orp.png',
    'https://res.cloudinary.com/du3ko16j1/image/upload/v1781599347/app-mairies/illustrations/initiative-event-image-default/nature_-_Moyenne_wsyfio.png'),
  ('culture', 'Culture', 3, 'palette', '#9A52FF',
    'https://res.cloudinary.com/du3ko16j1/image/upload/v1781597742/app-mairies/illustrations/initiative-event-categories-pin/culture-small_lnc9kh.png',
    'https://res.cloudinary.com/du3ko16j1/image/upload/v1781599341/app-mairies/illustrations/initiative-event-image-default/culture_-_Moyenne_wifzuj.png'),
  ('convivialite', 'Convivialité', 4, 'party-popper', '#FF7FCB',
    'https://res.cloudinary.com/du3ko16j1/image/upload/v1781597741/app-mairies/illustrations/initiative-event-categories-pin/convivialite-small_l7fnk1.png',
    'https://res.cloudinary.com/du3ko16j1/image/upload/v1781599340/app-mairies/illustrations/initiative-event-image-default/convivialite_-_Moyenne_ctjapz.png'),
  ('sport', 'Sport', 5, 'dumbbell', '#FFB347',
    'https://res.cloudinary.com/du3ko16j1/image/upload/v1781597750/app-mairies/illustrations/initiative-event-categories-pin/sport-small_vpszdn.png',
    'https://res.cloudinary.com/du3ko16j1/image/upload/v1781599352/app-mairies/illustrations/initiative-event-image-default/sport_-_Moyenne_tgayhl.png'),
  ('jeunesse', 'Jeunesse', 6, 'baby', '#FFC93D',
    'https://res.cloudinary.com/du3ko16j1/image/upload/v1781597744/app-mairies/illustrations/initiative-event-categories-pin/jeunesse-small_gfa4hf.png',
    'https://res.cloudinary.com/du3ko16j1/image/upload/v1781599344/app-mairies/illustrations/initiative-event-image-default/jeunesse_-_Moyenne_o7qjkr.png'),
  ('seniors', 'Seniors', 7, 'armchair', '#35D1D1',
    'https://res.cloudinary.com/du3ko16j1/image/upload/v1781597748/app-mairies/illustrations/initiative-event-categories-pin/senior-small_vmbkqz.png',
    'https://res.cloudinary.com/du3ko16j1/image/upload/v1781599349/app-mairies/illustrations/initiative-event-image-default/senior_-_Moyenne_ajlhb9.png'),
  ('numerique', 'Numérique', 8, 'monitor', '#1BB9D9',
    'https://res.cloudinary.com/du3ko16j1/image/upload/v1781597747/app-mairies/illustrations/initiative-event-categories-pin/numerique-small_hhh7ix.png',
    'https://res.cloudinary.com/du3ko16j1/image/upload/v1781599348/app-mairies/illustrations/initiative-event-image-default/numerique_-_Moyenne_rjq8mi.png'),
  ('intergenerationnel', 'Intergénérationnel', 9, 'users', '#F120D2',
    'https://res.cloudinary.com/du3ko16j1/image/upload/v1781597743/app-mairies/illustrations/initiative-event-categories-pin/intergenerationnel-small_m71z9m.png',
    'https://res.cloudinary.com/du3ko16j1/image/upload/v1781599343/app-mairies/illustrations/initiative-event-image-default/intergenerationnel_-_Moyenne_jqq9wi.png'),
  ('mobilite', 'Mobilité', 10, 'car', '#4A9FD4',
    'https://res.cloudinary.com/du3ko16j1/image/upload/v1781597745/app-mairies/illustrations/initiative-event-categories-pin/mobilite-small_qh8l3c.png',
    'https://res.cloudinary.com/du3ko16j1/image/upload/v1781599345/app-mairies/illustrations/initiative-event-image-default/mobilite_-_Moyenne_tjwh2q.png'),
  ('citoyennete', 'Citoyenneté', 11, 'landmark', '#E8C07A',
    'https://res.cloudinary.com/du3ko16j1/image/upload/v1781597739/app-mairies/illustrations/initiative-event-categories-pin/citoyennete-small_shmhps.png',
    'https://res.cloudinary.com/du3ko16j1/image/upload/v1781599339/app-mairies/illustrations/initiative-event-image-default/citoyennete_2_hlnbif.png'),
  ('autre', 'Autre', 12, 'more-horizontal', '#A8A8A8',
    'https://res.cloudinary.com/du3ko16j1/image/upload/v1781597739/app-mairies/illustrations/initiative-event-categories-pin/autre-small_ihquwt.png',
    'https://res.cloudinary.com/du3ko16j1/image/upload/v1781599339/app-mairies/illustrations/initiative-event-image-default/autre_-_Moyenne_si9mws.png');

-- =============================================================================
-- 3. Alter initiatives: add photo_url, add FK on category_slug
-- =============================================================================

ALTER TABLE public.initiatives
  ADD COLUMN IF NOT EXISTS photo_url text;

-- Repoint category FK from content_categories to initiative_event_categories.
ALTER TABLE public.initiatives DROP CONSTRAINT IF EXISTS initiatives_category_slug_fkey;

ALTER TABLE public.initiatives
  ADD CONSTRAINT initiatives_category_slug_fkey
  FOREIGN KEY (category_slug) REFERENCES public.initiative_event_categories (slug);

-- =============================================================================
-- 4. Alter events: add category_slug, source_initiative_id, volunteers_needed
-- =============================================================================

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS category_slug text REFERENCES public.initiative_event_categories (slug);

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS source_initiative_id uuid REFERENCES public.initiatives (id) ON DELETE SET NULL;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS volunteers_needed integer;
