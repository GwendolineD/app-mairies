-- Drop legacy lifecycle columns replaced by the new email_queue system.

ALTER TABLE public.announcements
  DROP COLUMN IF EXISTS expiring_soon_sent_at,
  DROP COLUMN IF EXISTS expired_notified_at,
  DROP COLUMN IF EXISTS stale_nudge_sent_at;
