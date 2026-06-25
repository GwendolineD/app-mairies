-- Persist restore metadata on reports so treated cards can show who restored and when.

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS restored_at timestamptz,
  ADD COLUMN IF NOT EXISTS restored_by_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reports_restored_at ON public.reports (restored_at DESC)
WHERE restored_at IS NOT NULL;
