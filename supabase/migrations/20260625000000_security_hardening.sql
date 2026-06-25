-- Protect sensitive profile columns from self-elevation (is_platform_admin, ban fields).
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Bypass for service_role and direct postgres (scripts, seeds, migrations)
  IF current_setting('request.jwt.claim.role', true) = 'service_role'
     OR current_user IN ('postgres', 'supabase_admin')
  THEN
    RETURN NEW;
  END IF;

  -- Only platform admins can modify these columns
  IF NOT public.is_platform_admin() THEN
    NEW.is_platform_admin := OLD.is_platform_admin;
    NEW.banned_at := OLD.banned_at;
    NEW.banned_by := OLD.banned_by;
    NEW.ban_reason := OLD.ban_reason;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_sensitive ON public.profiles;

CREATE TRIGGER trg_protect_profile_sensitive
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_sensitive_columns();

-- Protect membership role/status/suspension from self-elevation.
CREATE OR REPLACE FUNCTION public.protect_membership_sensitive_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Bypass for service_role and direct postgres
  IF current_setting('request.jwt.claim.role', true) = 'service_role'
     OR current_user IN ('postgres', 'supabase_admin')
  THEN
    RETURN NEW;
  END IF;

  -- Staff or platform admin can change anything
  IF public.is_platform_admin()
     OR public.is_municipality_staff_for_commune(OLD.commune_id)
  THEN
    RETURN NEW;
  END IF;

  -- Self-update: allow only specific status transitions (joinCommune, future leave)
  IF auth.uid() = OLD.user_id THEN
    IF NEW.status IN ('active', 'left') AND OLD.status NOT IN ('suspended') THEN
      NEW.role := OLD.role;
      NEW.suspended_at := OLD.suspended_at;
      NEW.suspension_reason := OLD.suspension_reason;
      RETURN NEW;
    END IF;
  END IF;

  -- Default: freeze all sensitive columns
  NEW.role := OLD.role;
  NEW.status := OLD.status;
  NEW.suspended_at := OLD.suspended_at;
  NEW.suspension_reason := OLD.suspension_reason;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_membership_sensitive ON public.memberships;

CREATE TRIGGER trg_protect_membership_sensitive
  BEFORE UPDATE ON public.memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_membership_sensitive_columns();
