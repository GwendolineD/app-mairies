-- =============================================================================
-- Add intended_role + inviter_user_id to neighbor_invites
-- Enables role-aware invitations from mairie/backoffice
-- =============================================================================

-- 1. New columns
ALTER TABLE public.neighbor_invites
  ADD COLUMN IF NOT EXISTS intended_role public.membership_role NOT NULL DEFAULT 'member';

ALTER TABLE public.neighbor_invites
  ADD COLUMN IF NOT EXISTS inviter_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_neighbor_invites_inviter_user
  ON public.neighbor_invites (inviter_user_id)
  WHERE inviter_user_id IS NOT NULL;

-- 2. Make inviter_membership_id nullable (was NOT NULL)
ALTER TABLE public.neighbor_invites
  ALTER COLUMN inviter_membership_id DROP NOT NULL;

-- At least one inviter identifier must be present
ALTER TABLE public.neighbor_invites
  ADD CONSTRAINT chk_neighbor_invites_has_inviter
  CHECK (inviter_membership_id IS NOT NULL OR inviter_user_id IS NOT NULL);

-- 3. Backfill inviter_user_id for existing rows
UPDATE public.neighbor_invites ni
SET inviter_user_id = m.user_id
FROM public.memberships m
WHERE m.id = ni.inviter_membership_id
  AND ni.inviter_user_id IS NULL;

-- 4. Update trigger: enforce_neighbor_inviter_commune
--    Now handles nullable inviter_membership_id (admin invites)
CREATE OR REPLACE FUNCTION public.enforce_neighbor_inviter_commune()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.inviter_membership_id IS NOT NULL THEN
    -- Original check: membership must be active in the target commune
    IF NOT EXISTS (
      SELECT 1
      FROM public.memberships m
      WHERE m.id = NEW.inviter_membership_id
        AND m.commune_id = NEW.commune_id
        AND m.status = 'active'
    ) THEN
      RAISE EXCEPTION 'inviter_membership must be active membership for commune';
    END IF;
  ELSE
    -- No membership: inviter_user_id must be a platform admin
    IF NOT EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = NEW.inviter_user_id
        AND p.is_platform_admin = true
    ) THEN
      RAISE EXCEPTION 'inviter without membership must be platform admin';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 5. New trigger: enforce intended_role permissions
CREATE OR REPLACE FUNCTION public.enforce_invite_intended_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Bypass for service_role and direct postgres
  IF current_setting('request.jwt.claim.role', true) = 'service_role'
     OR current_user IN ('postgres', 'supabase_admin')
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

CREATE TRIGGER trg_enforce_invite_intended_role
  BEFORE INSERT ON public.neighbor_invites
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_invite_intended_role();

-- 6. Updated RLS policies for neighbor_invites
DROP POLICY IF EXISTS neighbor_invites_select ON public.neighbor_invites;
CREATE POLICY neighbor_invites_select ON public.neighbor_invites FOR SELECT
USING (
  public.is_platform_admin()
  OR public.is_municipality_staff_for_commune(commune_id)
  OR (
    inviter_membership_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.memberships m
      WHERE m.id = inviter_membership_id
        AND m.user_id = (select auth.uid())
    )
  )
  OR inviter_user_id = (select auth.uid())
);

DROP POLICY IF EXISTS neighbor_invites_insert ON public.neighbor_invites;
CREATE POLICY neighbor_invites_insert ON public.neighbor_invites FOR INSERT
WITH CHECK (
  -- Resident inviting a neighbor (original path)
  EXISTS (
    SELECT 1
    FROM public.memberships m
    WHERE m.id = inviter_membership_id
      AND m.user_id = (select auth.uid())
      AND m.status = 'active'
      AND m.commune_id = neighbor_invites.commune_id
  )
  -- Staff inviting (may or may not set inviter_membership_id)
  OR public.is_municipality_staff_for_commune(commune_id)
  -- Platform admin inviting
  OR public.is_platform_admin()
);

DROP POLICY IF EXISTS neighbor_invites_update ON public.neighbor_invites;
CREATE POLICY neighbor_invites_update ON public.neighbor_invites FOR UPDATE
USING (
  (
    inviter_membership_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.memberships m
      WHERE m.id = inviter_membership_id
        AND m.user_id = (select auth.uid())
    )
  )
  OR inviter_user_id = (select auth.uid())
  OR public.is_municipality_staff_for_commune(commune_id)
  OR public.is_platform_admin()
);

DROP POLICY IF EXISTS neighbor_invites_delete ON public.neighbor_invites;
CREATE POLICY neighbor_invites_delete ON public.neighbor_invites FOR DELETE
USING (
  (
    inviter_membership_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.memberships m
      WHERE m.id = inviter_membership_id
        AND m.user_id = (select auth.uid())
    )
  )
  OR inviter_user_id = (select auth.uid())
  OR public.is_platform_admin()
);

-- 7. Email template for staff invitations
INSERT INTO public.email_templates (slug, subject, body_html, description)
VALUES (
  'staff-invitation',
  'La mairie de {{commune_name}} vous invite sur {{app_name}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #252630; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .header img { height: 40px; }
    .content { background: #f5f5f6; border-radius: 12px; padding: 24px; }
    .role-badge { display: inline-block; background: linear-gradient(135deg, #9A52FF, #35D1D1); color: white; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; }
    .cta { display: inline-block; background: linear-gradient(135deg, #FF7FCB, #9A52FF); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin-top: 16px; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #7d7e8d; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{logo_url}}" alt="{{app_name}}">
    </div>
    <h2>Vous êtes invité·e à rejoindre {{commune_name}}</h2>
    <div class="content">
      <p>Bonjour,</p>
      <p>La mairie de <strong>{{commune_name}}</strong> vous invite à rejoindre {{app_name}} en tant que :</p>
      <p style="text-align:center;"><span class="role-badge">{{role_label}}</span></p>
      <p>En créant votre compte, vous aurez immédiatement accès à l''espace dédié à votre rôle.</p>
      <p style="text-align:center;">
        <a href="{{invite_link}}" class="cta">Accepter l''invitation</a>
      </p>
    </div>
    <p style="margin-top: 20px; font-size: 14px;">À très vite sur {{app_name}} !</p>
    <div class="footer">
      <p>{{app_name}} — Découvrir · Partager · S''entraider</p>
    </div>
  </div>
</body>
</html>',
  'Email d''invitation envoyé par la mairie ou un administrateur pour rejoindre la plateforme avec un rôle spécifique'
)
ON CONFLICT (slug) DO UPDATE SET
  subject = excluded.subject,
  body_html = excluded.body_html,
  description = excluded.description;
