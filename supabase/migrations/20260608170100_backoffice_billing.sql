-- Vie Locale — Backoffice super admin: facturation & pilotage des clients.
-- Adds billing plan/amount on communes, a payments table, and admin RPCs used
-- by the platform backoffice. The 'suspended' subscription state is added in
-- the preceding migration.

-- =============================================================================
-- Enums
-- =============================================================================

CREATE TYPE public.commune_plan AS ENUM (
  'free',
  'standard',
  'premium'
);

CREATE TYPE public.payment_status AS ENUM (
  'paid',
  'pending',
  'failed',
  'refunded'
);

-- =============================================================================
-- Communes: billing columns
-- =============================================================================

ALTER TABLE public.communes
  ADD COLUMN IF NOT EXISTS plan public.commune_plan NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS monthly_amount_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS billing_email text,
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspension_reason text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE TRIGGER trg_communes_updated_at
BEFORE UPDATE ON public.communes
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at ();

-- =============================================================================
-- Commune payments (revenue tracking)
-- =============================================================================

CREATE TABLE public.commune_payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
  commune_id uuid NOT NULL REFERENCES public.communes (id) ON DELETE CASCADE,
  amount_cents integer NOT NULL CHECK (amount_cents >= 0),
  currency text NOT NULL DEFAULT 'EUR',
  status public.payment_status NOT NULL DEFAULT 'pending',
  period_start date,
  period_end date,
  paid_at timestamptz,
  note text,
  created_at timestamptz NOT NULL DEFAULT now ()
);

CREATE INDEX idx_commune_payments_commune_created_at
  ON public.commune_payments (commune_id, created_at DESC);

ALTER TABLE public.commune_payments ENABLE ROW LEVEL SECURITY;

-- Billing data is platform-only.
CREATE POLICY commune_payments_select_admin ON public.commune_payments FOR SELECT
USING (public.is_platform_admin ());

CREATE POLICY commune_payments_insert_admin ON public.commune_payments FOR INSERT
WITH CHECK (public.is_platform_admin ());

CREATE POLICY commune_payments_update_admin ON public.commune_payments FOR UPDATE
USING (public.is_platform_admin ())
WITH CHECK (public.is_platform_admin ());

CREATE POLICY commune_payments_delete_admin ON public.commune_payments FOR DELETE
USING (public.is_platform_admin ());

-- =============================================================================
-- Admin RPCs (SECURITY DEFINER, guarded by is_platform_admin)
-- =============================================================================

-- Per-commune overview with engagement counts + revenue. Returns no rows
-- unless the caller is a platform admin.
CREATE OR REPLACE FUNCTION public.admin_commune_overview ()
RETURNS TABLE (
  id uuid,
  insee_code text,
  name text,
  postcode text,
  department text,
  subscription_status public.subscription_status,
  plan public.commune_plan,
  monthly_amount_cents integer,
  billing_email text,
  suspended_at timestamptz,
  resident_count bigint,
  announcement_count bigint,
  initiative_count bigint,
  event_count bigint,
  paid_revenue_cents bigint,
  pending_revenue_cents bigint,
  last_payment_at timestamptz,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.insee_code,
    c.name,
    c.postcode,
    c.department,
    c.subscription_status,
    c.plan,
    c.monthly_amount_cents,
    c.billing_email,
    c.suspended_at,
    (SELECT count(*) FROM public.memberships m
      WHERE m.commune_id = c.id AND m.status = 'active'),
    (SELECT count(*) FROM public.announcements a WHERE a.commune_id = c.id),
    (SELECT count(*) FROM public.initiatives i WHERE i.commune_id = c.id),
    (SELECT count(*) FROM public.events e WHERE e.commune_id = c.id),
    COALESCE((SELECT sum(p.amount_cents) FROM public.commune_payments p
      WHERE p.commune_id = c.id AND p.status = 'paid'), 0),
    COALESCE((SELECT sum(p.amount_cents) FROM public.commune_payments p
      WHERE p.commune_id = c.id AND p.status = 'pending'), 0),
    (SELECT max(p.paid_at) FROM public.commune_payments p
      WHERE p.commune_id = c.id AND p.status = 'paid'),
    c.created_at
  FROM public.communes c
  WHERE public.is_platform_admin ()
  ORDER BY c.name;
$$;

-- Users attached to a commune (with auth ban state + content count).
CREATE OR REPLACE FUNCTION public.admin_commune_users (p_commune_id uuid)
RETURNS TABLE (
  user_id uuid,
  email text,
  display_name text,
  first_name text,
  last_name text,
  role public.user_role,
  membership_id uuid,
  membership_status public.membership_status,
  is_banned boolean,
  address_label text,
  announcement_count bigint,
  joined_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    p.user_id,
    u.email::text,
    p.display_name,
    p.first_name,
    p.last_name,
    p.role,
    m.id,
    m.status,
    (u.banned_until IS NOT NULL AND u.banned_until > now()),
    COALESCE(m.address_street, m.address_city, ''),
    (SELECT count(*) FROM public.announcements a
      WHERE a.author_membership_id = m.id),
    m.created_at
  FROM public.memberships m
  JOIN public.profiles p ON p.user_id = m.user_id
  JOIN auth.users u ON u.id = m.user_id
  WHERE m.commune_id = p_commune_id
    AND public.is_platform_admin ()
  ORDER BY m.created_at DESC;
$$;

-- Global platform KPIs for the backoffice dashboard / stats screens.
CREATE OR REPLACE FUNCTION public.admin_platform_stats ()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN NOT public.is_platform_admin () THEN '{}'::json
    ELSE json_build_object(
      'communes_total', (SELECT count(*) FROM public.communes),
      'communes_active', (SELECT count(*) FROM public.communes WHERE subscription_status = 'active'),
      'communes_trial', (SELECT count(*) FROM public.communes WHERE subscription_status = 'trial'),
      'communes_suspended', (SELECT count(*) FROM public.communes WHERE subscription_status = 'suspended'),
      'communes_inactive', (SELECT count(*) FROM public.communes WHERE subscription_status = 'inactive'),
      'residents_total', (SELECT count(*) FROM public.memberships WHERE status = 'active'),
      'announcements_total', (SELECT count(*) FROM public.announcements),
      'initiatives_total', (SELECT count(*) FROM public.initiatives),
      'events_total', (SELECT count(*) FROM public.events),
      'mrr_cents', COALESCE((SELECT sum(monthly_amount_cents) FROM public.communes WHERE subscription_status = 'active'), 0),
      'revenue_paid_cents', COALESCE((SELECT sum(amount_cents) FROM public.commune_payments WHERE status = 'paid'), 0),
      'revenue_pending_cents', COALESCE((SELECT sum(amount_cents) FROM public.commune_payments WHERE status = 'pending'), 0),
      'payments_paid_count', (SELECT count(*) FROM public.commune_payments WHERE status = 'paid'),
      'revenue_last_30d_cents', COALESCE((SELECT sum(amount_cents) FROM public.commune_payments WHERE status = 'paid' AND paid_at >= now() - interval '30 days'), 0)
    )
  END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_commune_overview () TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_commune_users (uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_platform_stats () TO authenticated;
