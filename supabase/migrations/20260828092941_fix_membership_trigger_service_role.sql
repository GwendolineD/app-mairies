-- Fix: service_role bypass in protect_membership_sensitive_columns trigger.
-- PostgREST sets current_user = 'service_role' but does NOT always populate
-- request.jwt.claim.role (depends on PostgREST version / claims format).
-- Adding 'service_role' to the current_user check ensures the bypass works
-- regardless of how JWT claims are stored.

CREATE OR REPLACE FUNCTION public.protect_membership_sensitive_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Bypass for service_role and direct postgres
  IF current_setting('request.jwt.claim.role', true) = 'service_role'
     OR current_user IN ('postgres', 'supabase_admin', 'service_role')
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
