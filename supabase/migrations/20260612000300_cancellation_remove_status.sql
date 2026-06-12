-- Remove status workflow from cancellation_requests
-- Cancellations are now immediate (no pending/processed/rejected flow)

-- Drop the partial index that depends on status column
DROP INDEX IF EXISTS idx_cancellation_requests_subscription;

-- Drop the UPDATE policy (no more admin validation)
DROP POLICY IF EXISTS cancellation_requests_update ON public.cancellation_requests;

-- Remove status and processed_at columns
ALTER TABLE public.cancellation_requests
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS processed_at;

-- Add unique constraint: one cancellation per subscription period
ALTER TABLE public.cancellation_requests
  ADD CONSTRAINT cancellation_requests_subscription_id_unique UNIQUE (subscription_id);

-- Recreate simple index on subscription_id
CREATE INDEX idx_cancellation_requests_subscription
  ON public.cancellation_requests(subscription_id);
