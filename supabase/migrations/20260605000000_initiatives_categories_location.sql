-- Vie Locale - initiatives categories, photo and location
-- Adds a shared category lookup table (initiatives + events) plus
-- presentation fields (photo, human-readable location) on initiatives.

-- =============================================================================
-- Shared content categories (initiatives & events share the same taxonomy)
-- =============================================================================

CREATE TABLE public.content_categories (
  slug text PRIMARY KEY,
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  icon_url text,
  map_pin_url text
);

INSERT INTO public.content_categories (slug, label, sort_order)
VALUES
  ('solidarite', 'Solidarité', 1),
  ('nature', 'Nature', 2),
  ('culture', 'Culture', 3),
  ('convivialite', 'Convivialité', 4),
  ('sport', 'Sport', 5),
  ('jeunesse', 'Jeunesse', 6),
  ('seniors', 'Seniors', 7),
  ('numerique', 'Numérique', 8),
  ('intergenerationnel', 'Intergénérationnel', 9),
  ('mobilite', 'Mobilité', 10),
  ('citoyennete', 'Citoyenneté', 11),
  ('autre', 'Autre', 12)
ON CONFLICT (slug) DO UPDATE SET
  label = excluded.label,
  sort_order = excluded.sort_order;

-- =============================================================================
-- Initiatives: category, photo and human-readable location
-- =============================================================================

ALTER TABLE public.initiatives
  ADD COLUMN category_slug text NOT NULL DEFAULT 'autre'
    REFERENCES public.content_categories (slug),
  ADD COLUMN photo_url text,
  ADD COLUMN location_label text;

-- Browse initiatives within a commune filtered by category.
CREATE INDEX idx_initiatives_commune_category
  ON public.initiatives (commune_id, category_slug);

-- =============================================================================
-- Row Level Security + grants (mirror announcement_categories)
-- =============================================================================

ALTER TABLE public.content_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY content_categories_select_public ON public.content_categories FOR SELECT
USING (auth.role () IN ('anon', 'authenticated'));

CREATE POLICY content_categories_write_admin ON public.content_categories FOR ALL
USING (public.is_platform_admin ())
WITH CHECK (public.is_platform_admin ());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_categories TO authenticated;
GRANT ALL ON public.content_categories TO postgres, service_role;
GRANT SELECT ON public.content_categories TO anon;
