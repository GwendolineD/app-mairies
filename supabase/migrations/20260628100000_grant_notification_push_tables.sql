-- Grant authenticated role access to notification preferences and push subscriptions tables
-- These tables were created in 20260614000000 but missing explicit GRANT statements.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_notification_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
