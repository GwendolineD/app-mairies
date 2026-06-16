-- Link cancellation requests to a specific subscription period

ALTER TABLE public.cancellation_requests
  ADD COLUMN subscription_id uuid REFERENCES public.commune_subscriptions(id) ON DELETE CASCADE;

CREATE INDEX idx_cancellation_requests_subscription
  ON public.cancellation_requests(subscription_id, created_at DESC)
  WHERE status = 'pending';
