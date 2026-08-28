-- Remove the shared trial access code mechanism.
-- All trial access now goes through individual invitations (neighbor_invites).

-- 1. Drop column (cascade drops the unique index)
ALTER TABLE public.communes DROP COLUMN IF EXISTS trial_access_code;

-- 2. Drop the validation RPC
DROP FUNCTION IF EXISTS public.validate_trial_access_code(uuid, text);

-- 3. Remove the trial-invitation email template (replaced by staff-invitation)
DELETE FROM public.email_templates WHERE slug = 'trial-invitation';

-- 4. Fix RLS DELETE on neighbor_invites — add is_municipality_staff_for_commune
--    (aligns with the UPDATE policy which already includes it)
DROP POLICY IF EXISTS neighbor_invites_delete ON public.neighbor_invites;
CREATE POLICY neighbor_invites_delete ON public.neighbor_invites FOR DELETE
USING (
  (
    inviter_membership_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.id = inviter_membership_id AND m.user_id = (select auth.uid())
    )
  )
  OR inviter_user_id = (select auth.uid())
  OR public.is_municipality_staff_for_commune(commune_id)
  OR public.is_platform_admin()
);
