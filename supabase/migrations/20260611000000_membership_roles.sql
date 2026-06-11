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
