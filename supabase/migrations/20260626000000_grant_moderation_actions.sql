-- moderation_actions was created after the baseline GRANT ON ALL TABLES;
-- authenticated role needs explicit privileges for journal reads/writes.

GRANT USAGE ON TYPE public.moderation_action_type TO authenticated, service_role;
GRANT USAGE ON TYPE public.moderation_target_type TO authenticated, service_role;

GRANT SELECT, INSERT ON public.moderation_actions TO authenticated, service_role;
