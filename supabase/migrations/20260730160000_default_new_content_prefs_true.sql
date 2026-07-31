-- One-time data migration: enable new-content notification prefs for all users.
-- Future inserts rely on the updated column defaults below.

ALTER TABLE public.user_notification_preferences
  ALTER COLUMN notify_new_announcement SET DEFAULT true,
  ALTER COLUMN notify_new_initiative SET DEFAULT true,
  ALTER COLUMN notify_new_event SET DEFAULT true;

UPDATE public.user_notification_preferences
SET notify_new_announcement = true,
    notify_new_initiative = true,
    notify_new_event = true,
    updated_at = now();

INSERT INTO public.user_notification_preferences (user_id)
SELECT u.id
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1
  FROM public.user_notification_preferences p
  WHERE p.user_id = u.id
);
