-- Subject 9 phase 3b: wrap auth.uid() in session/identity RLS policies.

DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles FOR SELECT
USING (
  user_id = (select auth.uid())
  OR public.is_platform_admin()
  OR public.share_active_commune_with(user_id)
);

DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles FOR UPDATE
USING (public.is_platform_admin() OR user_id = (select auth.uid()))
WITH CHECK (public.is_platform_admin() OR user_id = (select auth.uid()));

DROP POLICY IF EXISTS memberships_select ON public.memberships;
CREATE POLICY memberships_select ON public.memberships FOR SELECT
USING (
  public.is_platform_admin()
  OR public.is_municipality_staff_for_commune(commune_id)
  OR public.share_active_commune_with(user_id)
  OR (select auth.uid()) = user_id
);

DROP POLICY IF EXISTS memberships_insert ON public.memberships;
CREATE POLICY memberships_insert ON public.memberships FOR INSERT
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS memberships_update ON public.memberships;
CREATE POLICY memberships_update ON public.memberships FOR UPDATE
USING (
  public.is_platform_admin()
  OR public.is_municipality_staff_for_commune(commune_id)
  OR (select auth.uid()) = user_id
);

DROP POLICY IF EXISTS memberships_delete ON public.memberships;
CREATE POLICY memberships_delete ON public.memberships FOR DELETE
USING (public.is_platform_admin() OR (select auth.uid()) = user_id);
