-- Subject 9 phase 3d: wrap auth.uid() in remaining tenant-scoped RLS policies.

DROP POLICY IF EXISTS reports_select ON public.reports;
CREATE POLICY reports_select ON public.reports FOR SELECT
USING (
  public.is_platform_admin()
  OR public.is_municipality_staff_for_commune(commune_id)
  OR EXISTS (
    SELECT 1
    FROM public.memberships m
    WHERE m.id = reporter_membership_id
      AND m.user_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS moderation_appeals_select ON public.moderation_appeals;
CREATE POLICY moderation_appeals_select ON public.moderation_appeals FOR SELECT
USING (
  public.is_platform_admin()
  OR appellant_user_id = (select auth.uid())
  OR public.is_municipality_staff_for_commune(
      (
        SELECT r.commune_id
        FROM public.reports r
        WHERE r.id = moderation_appeals.report_id
      )
    )
);

DROP POLICY IF EXISTS moderation_appeals_insert ON public.moderation_appeals;
CREATE POLICY moderation_appeals_insert ON public.moderation_appeals FOR INSERT
WITH CHECK (appellant_user_id = (select auth.uid()));

DROP POLICY IF EXISTS neighbor_invites_select ON public.neighbor_invites;
CREATE POLICY neighbor_invites_select ON public.neighbor_invites FOR SELECT
USING (
  public.is_platform_admin()
  OR public.is_municipality_staff_for_commune(commune_id)
  OR EXISTS (
    SELECT 1
    FROM public.memberships m
    WHERE m.id = inviter_membership_id
      AND m.user_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS neighbor_invites_insert ON public.neighbor_invites;
CREATE POLICY neighbor_invites_insert ON public.neighbor_invites FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.memberships m
    WHERE m.id = inviter_membership_id
      AND m.user_id = (select auth.uid())
      AND m.status = 'active'
      AND m.commune_id = neighbor_invites.commune_id
  )
);

DROP POLICY IF EXISTS neighbor_invites_update ON public.neighbor_invites;
CREATE POLICY neighbor_invites_update ON public.neighbor_invites FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.memberships m
    WHERE m.id = inviter_membership_id
      AND m.user_id = (select auth.uid())
  )
  OR public.is_municipality_staff_for_commune(commune_id)
);

DROP POLICY IF EXISTS neighbor_invites_delete ON public.neighbor_invites;
CREATE POLICY neighbor_invites_delete ON public.neighbor_invites FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.memberships m
    WHERE m.id = inviter_membership_id
      AND m.user_id = (select auth.uid())
  )
  OR public.is_platform_admin()
);

DROP POLICY IF EXISTS content_outcomes_insert ON public.content_outcomes;
CREATE POLICY content_outcomes_insert ON public.content_outcomes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_active_membership(commune_id)
    AND membership_id IN (
      SELECT m.id
      FROM public.memberships m
      WHERE m.user_id = (select auth.uid())
        AND m.commune_id = content_outcomes.commune_id
        AND m.status = 'active'
    )
  );

DROP POLICY IF EXISTS analytics_events_insert ON public.analytics_events;
CREATE POLICY analytics_events_insert ON public.analytics_events FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
  AND (user_id IS NULL OR user_id = (select auth.uid()))
  AND (
    commune_id IS NULL
    OR public.has_active_membership(commune_id)
  )
);
