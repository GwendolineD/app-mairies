ALTER TABLE public.user_notification_preferences
  ADD COLUMN IF NOT EXISTS notify_initiative_support boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_event_participation boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_event_volunteer boolean NOT NULL DEFAULT true;
