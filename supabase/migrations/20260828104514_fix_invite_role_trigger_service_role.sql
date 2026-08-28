-- Fix: service_role bypass in enforce_invite_intended_role trigger.
-- Same issue as protect_membership_sensitive_columns (fixed in 20260828092941):
-- PostgREST sets current_user = 'service_role' but does NOT always populate
-- request.jwt.claim.role. Adding 'service_role' to the current_user check
-- ensures the bypass works regardless of how JWT claims are stored.

CREATE OR REPLACE FUNCTION public.enforce_invite_intended_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Bypass for service_role and direct postgres
  IF current_setting('request.jwt.claim.role', true) = 'service_role'
     OR current_user IN ('postgres', 'supabase_admin', 'service_role')
  THEN
    RETURN NEW;
  END IF;

  -- member role is always allowed
  IF NEW.intended_role = 'member' THEN
    RETURN NEW;
  END IF;

  -- Elevated roles require staff/mayor in the commune OR platform admin
  IF public.is_platform_admin() THEN
    RETURN NEW;
  END IF;

  IF public.is_municipality_staff_for_commune(NEW.commune_id) THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'only staff, mayor or platform admin can invite with elevated role';
END;
$$;
