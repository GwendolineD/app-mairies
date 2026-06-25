-- Communication assets (flyers, promotion kits for municipalities)

CREATE TABLE public.communication_assets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  commune_id uuid REFERENCES public.communes (id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  preview_url text NOT NULL,
  file_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_communication_assets_commune_sort
  ON public.communication_assets (commune_id, sort_order);

ALTER TABLE public.communication_assets ENABLE ROW LEVEL SECURITY;

-- Staff/mayor: read global assets + assets scoped to their commune
CREATE POLICY communication_assets_select ON public.communication_assets
  FOR SELECT USING (
    published = true
    AND (
      commune_id IS NULL
      OR public.is_municipality_staff_for_commune(commune_id)
    )
    OR public.is_platform_admin()
  );

-- Platform admin: full CRUD
CREATE POLICY communication_assets_admin ON public.communication_assets
  FOR ALL USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE TRIGGER trg_communication_assets_updated_at
BEFORE UPDATE ON public.communication_assets
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
