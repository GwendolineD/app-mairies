-- Soft delete: track when an announcement was archived by its author.
-- Announcements with archived_at set are purged by the lifecycle cron after 30 days.

ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- Partial index for the cron purge query (only archived rows with a timestamp).
CREATE INDEX IF NOT EXISTS idx_announcements_archived_purge
  ON public.announcements (status, archived_at)
  WHERE status = 'archivee' AND archived_at IS NOT NULL;
