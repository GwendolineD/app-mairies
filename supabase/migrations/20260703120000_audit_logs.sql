-- Audit logs: security/compliance trail for critical user and admin actions.

BEGIN;

CREATE TABLE public.audit_logs (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  -- WHO
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address   inet,
  user_agent   text,
  device_type  text,
  os_name      text,
  os_version   text,
  browser_name text,
  -- WHAT
  action       text NOT NULL,
  category     text NOT NULL,
  severity     text NOT NULL DEFAULT 'info',
  -- CONTEXT
  target_type  text,
  target_id    text,
  commune_id   uuid REFERENCES public.communes(id) ON DELETE SET NULL,
  -- DETAILS
  metadata     jsonb NOT NULL DEFAULT '{}'::jsonb,
  success      boolean NOT NULL DEFAULT true
);

CREATE INDEX idx_audit_created ON public.audit_logs (created_at DESC);
CREATE INDEX idx_audit_category_date ON public.audit_logs (category, created_at DESC);
CREATE INDEX idx_audit_user ON public.audit_logs (user_id, created_at DESC);
CREATE INDEX idx_audit_commune ON public.audit_logs (commune_id, created_at DESC)
  WHERE commune_id IS NOT NULL;
CREATE INDEX idx_audit_severity ON public.audit_logs (severity, created_at DESC)
  WHERE severity IN ('critical', 'warning');

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_logs_select ON public.audit_logs FOR SELECT
  USING (public.is_platform_admin());

-- Inserts use service_role (bypasses RLS). No INSERT/UPDATE/DELETE for authenticated/anon.

COMMIT;
