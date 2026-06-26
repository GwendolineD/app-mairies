-- Grant service_role access to push_subscriptions and user_notification_preferences.
-- These tables (created in 20260614000000) only granted privileges to the
-- authenticated role (20260628100000). The service-role client used by the
-- server-side push sender (sendPushToUser) and the new-content fanout
-- (fanoutNewContentNotification) was hitting "permission denied for table
-- push_subscriptions" / user_notification_preferences, so no push was ever sent.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_notification_preferences TO service_role;
