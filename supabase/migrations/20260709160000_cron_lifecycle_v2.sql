-- Cron lifecycle v2: email queue, nudge columns, and supporting indexes.

BEGIN;

-- =============================================================================
-- 1. New columns on existing tables
-- =============================================================================

ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS post_date_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS stale_60d_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS nudge_snoozed_until timestamptz;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS post_event_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS nudge_snoozed_until timestamptz;

ALTER TABLE public.initiatives
  ADD COLUMN IF NOT EXISTS stale_60d_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS nudge_snoozed_until timestamptz;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS engagement_reminder_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS notification_prompt_email_sent_at timestamptz;

ALTER TABLE public.neighbor_invites
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;

-- Email lifecycle opt-out preference
ALTER TABLE public.user_notification_preferences
  ADD COLUMN IF NOT EXISTS email_lifecycle_enabled boolean NOT NULL DEFAULT true;

-- =============================================================================
-- 2. Email queue table (internal, service_role only)
-- =============================================================================

CREATE TABLE public.email_queue (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  to_email text NOT NULL,
  template_slug text NOT NULL,
  variables jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  attempts int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 3,
  last_error text,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  related_content_type text,
  related_content_id uuid
);

CREATE INDEX idx_email_queue_pending
  ON public.email_queue (scheduled_at)
  WHERE status = 'pending';

CREATE INDEX idx_email_queue_content
  ON public.email_queue (related_content_type, related_content_id)
  WHERE status = 'pending';

-- No RLS — internal table accessed only via service_role
GRANT ALL ON public.email_queue TO service_role;

-- =============================================================================
-- 3. Partial indexes for cron performance
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_announcements_nudge_eligible
  ON public.announcements (status, target_date, nudge_snoozed_until)
  WHERE status = 'ouverte';

CREATE INDEX IF NOT EXISTS idx_events_nudge_eligible
  ON public.events (status, ends_at, nudge_snoozed_until)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_initiatives_nudge_eligible
  ON public.initiatives (status, created_at, nudge_snoozed_until)
  WHERE status = 'active';

COMMIT;
