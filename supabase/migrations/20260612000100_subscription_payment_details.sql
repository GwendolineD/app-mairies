-- Add payment details columns to commune_subscriptions

ALTER TABLE public.commune_subscriptions
  ADD COLUMN paid_at date,
  ADD COLUMN payment_method text;

COMMENT ON COLUMN public.commune_subscriptions.paid_at IS 'Date when payment was received';
COMMENT ON COLUMN public.commune_subscriptions.payment_method IS 'Payment method (Virement, Chèque, CB, Prélèvement, etc.)';
