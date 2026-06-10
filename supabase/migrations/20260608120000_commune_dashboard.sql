-- Vie Locale — Commune dashboard
-- Adds subscription detail fields, a staff-visibility profiles policy, and a
-- monthly aggregation RPC powering the municipality dashboard charts.

-- =============================================================================
-- 1. Subscription detail columns on communes
--    Existing `subscription_status` only describes the lifecycle state; the
--    dashboard also needs the billing window and payment flag.
-- =============================================================================

ALTER TABLE public.communes
  ADD COLUMN IF NOT EXISTS subscription_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_paid boolean NOT NULL DEFAULT false;

-- =============================================================================
-- 2. Let municipality staff read the profiles of their commune members.
--    The dashboard habitants list shows names for every membership status, but
--    `profiles_select` only exposes profiles of users sharing an *active*
--    membership. RLS SELECT policies are OR-combined, so this widens visibility
--    strictly for staff of the member's commune.
-- =============================================================================

CREATE POLICY profiles_select_staff ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.memberships m
    WHERE m.user_id = profiles.user_id
      AND public.is_municipality_staff_for_commune (m.commune_id)
  )
);

-- =============================================================================
-- 3. Monthly aggregation for the commune dashboard charts.
--    Computed on demand (no stored counters to keep in sync). SECURITY DEFINER
--    so it can aggregate across a commune, but gated to municipality staff /
--    platform admin to prevent cross-tenant leaks. Returns one gap-filled row
--    per month from the commune creation month through the current month.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.commune_dashboard_monthly(p_commune_id uuid)
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
  ),
  ann AS (
    SELECT
      date_trunc('month', created_at)::date AS month,
      count(*) FILTER (WHERE type = 'demande') AS demandes,
      count(*) FILTER (WHERE type = 'offre') AS offres
    FROM public.announcements
    WHERE commune_id = p_commune_id
    GROUP BY 1
  ),
  ini AS (
    SELECT date_trunc('month', created_at)::date AS month, count(*) AS n
    FROM public.initiatives
    WHERE commune_id = p_commune_id
    GROUP BY 1
  ),
  evt AS (
    SELECT date_trunc('month', created_at)::date AS month, count(*) AS n
    FROM public.events
    WHERE commune_id = p_commune_id
    GROUP BY 1
  )
  SELECT
    m.month,
    COALESCE(mem.n, 0)::bigint AS new_members,
    COALESCE(ann.demandes, 0)::bigint AS demandes,
    COALESCE(ann.offres, 0)::bigint AS offres,
    COALESCE(ini.n, 0)::bigint AS initiatives,
    COALESCE(evt.n, 0)::bigint AS events
  FROM months m
  LEFT JOIN mem ON mem.month = m.month
  LEFT JOIN ann ON ann.month = m.month
  LEFT JOIN ini ON ini.month = m.month
  LEFT JOIN evt ON evt.month = m.month
  ORDER BY m.month;
$$;

REVOKE ALL ON FUNCTION public.commune_dashboard_monthly (uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.commune_dashboard_monthly (uuid) TO authenticated;
