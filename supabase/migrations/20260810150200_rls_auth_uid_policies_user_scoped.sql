-- Subject 9 phase 3a: wrap auth.uid() in user-scoped RLS policies.

DROP POLICY IF EXISTS notifications_select ON public.notifications;
CREATE POLICY notifications_select ON public.notifications FOR SELECT
USING (public.is_platform_admin() OR user_id = (select auth.uid()));

DROP POLICY IF EXISTS notifications_update ON public.notifications;
CREATE POLICY notifications_update ON public.notifications FOR UPDATE
USING (public.is_platform_admin() OR user_id = (select auth.uid()));

DROP POLICY IF EXISTS notifications_delete ON public.notifications;
CREATE POLICY notifications_delete ON public.notifications FOR DELETE
USING (public.is_platform_admin() OR user_id = (select auth.uid()));

DROP POLICY IF EXISTS push_subscriptions_select ON public.push_subscriptions;
CREATE POLICY push_subscriptions_select ON public.push_subscriptions FOR SELECT
USING (user_id = (select auth.uid()) OR public.is_platform_admin());

DROP POLICY IF EXISTS push_subscriptions_insert ON public.push_subscriptions;
CREATE POLICY push_subscriptions_insert ON public.push_subscriptions FOR INSERT
WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS push_subscriptions_update ON public.push_subscriptions;
CREATE POLICY push_subscriptions_update ON public.push_subscriptions FOR UPDATE
USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS push_subscriptions_delete ON public.push_subscriptions;
CREATE POLICY push_subscriptions_delete ON public.push_subscriptions FOR DELETE
USING (user_id = (select auth.uid()) OR public.is_platform_admin());

DROP POLICY IF EXISTS user_notification_preferences_select ON public.user_notification_preferences;
CREATE POLICY user_notification_preferences_select ON public.user_notification_preferences FOR SELECT
USING (user_id = (select auth.uid()) OR public.is_platform_admin());

DROP POLICY IF EXISTS user_notification_preferences_insert ON public.user_notification_preferences;
CREATE POLICY user_notification_preferences_insert ON public.user_notification_preferences FOR INSERT
WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS user_notification_preferences_update ON public.user_notification_preferences;
CREATE POLICY user_notification_preferences_update ON public.user_notification_preferences FOR UPDATE
USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS user_notification_preferences_delete ON public.user_notification_preferences;
CREATE POLICY user_notification_preferences_delete ON public.user_notification_preferences FOR DELETE
USING (user_id = (select auth.uid()) OR public.is_platform_admin());

DROP POLICY IF EXISTS support_requests_insert ON public.support_requests;
CREATE POLICY support_requests_insert ON public.support_requests FOR INSERT
WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS support_requests_select_own ON public.support_requests;
CREATE POLICY support_requests_select_own ON public.support_requests FOR SELECT
USING (user_id = (select auth.uid()));
