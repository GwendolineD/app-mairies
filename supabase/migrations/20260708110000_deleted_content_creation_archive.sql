-- Preserve historical content-creation counts in municipality dashboard charts
-- when authored content is hard-deleted (e.g. account deletion).

BEGIN;

CREATE TABLE IF NOT EXISTS public.deleted_content_creation_archive (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  commune_id uuid NOT NULL REFERENCES public.communes (id) ON DELETE CASCADE,
  content_kind text NOT NULL CHECK (content_kind IN ('announcement', 'initiative', 'event')),
  announcement_type text NULL CHECK (announcement_type IN ('demande', 'offre')),
  original_created_at timestamptz NOT NULL,
  CONSTRAINT deleted_content_archive_announcement_type_check CHECK (
    (content_kind = 'announcement' AND announcement_type IS NOT NULL)
    OR (content_kind IN ('initiative', 'event') AND announcement_type IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_deleted_content_archive_commune_kind
  ON public.deleted_content_creation_archive (commune_id, content_kind, original_created_at);

ALTER TABLE public.deleted_content_creation_archive ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS deleted_content_archive_select ON public.deleted_content_creation_archive;
CREATE POLICY deleted_content_archive_select ON public.deleted_content_creation_archive FOR SELECT
  USING (
    public.is_platform_admin ()
    OR public.is_municipality_staff_for_commune (commune_id)
  );

GRANT SELECT ON public.deleted_content_creation_archive TO authenticated;
GRANT ALL ON public.deleted_content_creation_archive TO service_role;

-- =============================================================================
-- commune_dashboard_monthly — include archived deleted content creations
-- =============================================================================

CREATE OR REPLACE FUNCTION public.commune_dashboard_monthly (p_commune_id uuid)
RETURNS TABLE (
  month date,
  new_members bigint,
  demandes bigint,
  offres bigint,
  initiatives bigint,
  events bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH bounds AS (
    SELECT
      date_trunc('month', c.created_at)::date AS start_month,
      date_trunc('month', now())::date AS end_month
    FROM public.communes c
    WHERE c.id = p_commune_id
      AND (
        public.is_municipality_staff_for_commune (p_commune_id)
        OR public.is_platform_admin ()
      )
  ),
  months AS (
    SELECT generate_series(b.start_month, b.end_month, interval '1 month')::date AS month
    FROM bounds b
  ),
  mem AS (
    SELECT date_trunc('month', created_at)::date AS month, count(*) AS n
    FROM public.memberships
    WHERE commune_id = p_commune_id
    GROUP BY 1
    UNION ALL
    SELECT date_trunc('month', original_created_at)::date AS month, count(*) AS n
    FROM public.deleted_membership_archive
    WHERE commune_id = p_commune_id
    GROUP BY 1
  ),
  mem_agg AS (
    SELECT month, sum(n) AS n
    FROM mem
    GROUP BY 1
  ),
  ann AS (
    SELECT
      month,
      count(*) FILTER (WHERE ann_type = 'demande') AS demandes,
      count(*) FILTER (WHERE ann_type = 'offre') AS offres
    FROM (
      SELECT
        date_trunc('month', created_at)::date AS month,
        type::text AS ann_type
      FROM public.announcements
      WHERE commune_id = p_commune_id
      UNION ALL
      SELECT
        date_trunc('month', original_created_at)::date AS month,
        announcement_type AS ann_type
      FROM public.deleted_content_creation_archive
      WHERE commune_id = p_commune_id
        AND content_kind = 'announcement'
    ) combined
    GROUP BY 1
  ),
  ini AS (
    SELECT month, sum(n) AS n
    FROM (
      SELECT date_trunc('month', created_at)::date AS month, count(*) AS n
      FROM public.initiatives
      WHERE commune_id = p_commune_id
      GROUP BY 1
      UNION ALL
      SELECT date_trunc('month', original_created_at)::date AS month, count(*) AS n
      FROM public.deleted_content_creation_archive
      WHERE commune_id = p_commune_id
        AND content_kind = 'initiative'
      GROUP BY 1
    ) combined
    GROUP BY 1
  ),
  evt AS (
    SELECT month, sum(n) AS n
    FROM (
      SELECT date_trunc('month', created_at)::date AS month, count(*) AS n
      FROM public.events
      WHERE commune_id = p_commune_id
      GROUP BY 1
      UNION ALL
      SELECT date_trunc('month', original_created_at)::date AS month, count(*) AS n
      FROM public.deleted_content_creation_archive
      WHERE commune_id = p_commune_id
        AND content_kind = 'event'
      GROUP BY 1
    ) combined
    GROUP BY 1
  )
  SELECT
    m.month,
    COALESCE(mem_agg.n, 0)::bigint AS new_members,
    COALESCE(ann.demandes, 0)::bigint AS demandes,
    COALESCE(ann.offres, 0)::bigint AS offres,
    COALESCE(ini.n, 0)::bigint AS initiatives,
    COALESCE(evt.n, 0)::bigint AS events
  FROM months m
  LEFT JOIN mem_agg ON mem_agg.month = m.month
  LEFT JOIN ann ON ann.month = m.month
  LEFT JOIN ini ON ini.month = m.month
  LEFT JOIN evt ON evt.month = m.month
  ORDER BY m.month;
$$;

COMMIT;
