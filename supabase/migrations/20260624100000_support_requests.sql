-- Resident support / assistance requests (tickets, feedback, bugs)

BEGIN;

CREATE TYPE public.support_request_status AS ENUM (
  'new',
  'in_progress',
  'resolved',
  'dismissed'
);

CREATE TABLE public.support_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  membership_id uuid REFERENCES public.memberships (id) ON DELETE SET NULL,
  commune_id uuid REFERENCES public.communes (id) ON DELETE SET NULL,
  user_email text NOT NULL,
  first_name text,
  last_name text,
  subject text NOT NULL,
  message text NOT NULL,
  status public.support_request_status NOT NULL DEFAULT 'new',
  admin_comment text,
  reviewed_at timestamptz,
  reviewed_by_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_requests_status_created
  ON public.support_requests (status, created_at DESC);

CREATE INDEX idx_support_requests_user_created
  ON public.support_requests (user_id, created_at DESC);

ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY support_requests_insert ON public.support_requests
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY support_requests_select ON public.support_requests
FOR SELECT
USING (public.is_platform_admin());

CREATE POLICY support_requests_update ON public.support_requests
FOR UPDATE
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

COMMIT;
