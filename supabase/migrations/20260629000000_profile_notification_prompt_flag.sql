-- Track whether the user dismissed the notification activation prompt
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_dismissed_notification_prompt boolean NOT NULL DEFAULT false;
