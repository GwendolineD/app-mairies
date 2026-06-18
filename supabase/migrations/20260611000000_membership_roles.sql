-- =============================================================================
-- Migration: move staff role from profiles to memberships
--
-- Before: profiles.role (user_role enum: resident | municipality_staff | platform_admin)
-- After:  memberships.role (membership_role enum: member | staff | mayor)
--         profiles.is_platform_admin (boolean)
-- =============================================================================

BEGIN;

-- 1. New enum for per-commune roles
CREATE TYPE public.membership_role AS ENUM ('member', 'staff', 'mayor');

-- 2. Add role column to memberships (default = member)
ALTER TABLE public.memberships
  ADD COLUMN role public.membership_role NOT NULL DEFAULT 'member';

-- 3. Migrate existing municipality_staff data:
--    set 'staff' on the membership matching their active commune
UPDATE public.memberships m
SET role = 'staff'
FROM public.profiles p
WHERE m.user_id = p.user_id
  AND m.commune_id = p.active_commune_id
  AND p.role = 'municipality_staff';

-- 4. Add is_platform_admin boolean to profiles
ALTER TABLE public.profiles
  ADD COLUMN is_platform_admin boolean NOT NULL DEFAULT false;

UPDATE public.profiles
SET is_platform_admin = true
WHERE role = 'platform_admin';

-- 4b. admin_commune_users (backoffice_billing) still references user_role — migrate it first.
DROP FUNCTION IF EXISTS public.admin_commune_users (uuid);

CREATE OR REPLACE FUNCTION public.admin_commune_users (p_commune_id uuid)
RETURNS TABLE (
  user_id uuid,
  email text,
  display_name text,
  first_name text,
  last_name text,
  role public.membership_role,
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
    m.role,
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

GRANT EXECUTE ON FUNCTION public.admin_commune_users (uuid) TO authenticated;

-- 5. Drop old role column and enum
ALTER TABLE public.profiles DROP COLUMN role;
DROP TYPE public.user_role;

-- 6. Update RLS helper: is_platform_admin()
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.is_platform_admin = true
  );
$$;

-- 7. Update RLS helper: is_municipality_staff_for_commune()
--    Now checks memberships.role instead of profiles.role + active_commune_id
CREATE OR REPLACE FUNCTION public.is_municipality_staff_for_commune(p_commune_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND m.commune_id = p_commune_id
      AND m.role IN ('staff', 'mayor')
      AND m.status = 'active'
  );
$$;

-- 8. Partial index for fast staff lookups per commune
CREATE INDEX idx_memberships_commune_staff
  ON public.memberships (commune_id, role)
  WHERE role IN ('staff', 'mayor');

COMMIT;
