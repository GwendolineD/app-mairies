-- Subscription system: access_status rename, subscription tables, email templates

-- =============================================================================
-- 1. Rename subscription_status to access_status
-- =============================================================================

ALTER TYPE public.subscription_status RENAME TO access_status;
ALTER TABLE public.communes RENAME COLUMN subscription_status TO access_status;
ALTER TABLE public.communes ADD COLUMN subscribed_since date;

-- =============================================================================
-- 2. Table commune_subscriptions (billing periods)
-- =============================================================================

CREATE TABLE public.commune_subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  commune_id uuid NOT NULL REFERENCES public.communes(id) ON DELETE CASCADE,
  starts_at date NOT NULL,
  ends_at date NOT NULL,
  amount_cents integer NOT NULL,
  payment_status text NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('paid', 'unpaid')),
  auto_renew boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT subscription_range_valid CHECK (ends_at >= starts_at)
);

CREATE INDEX idx_commune_subscriptions_commune
  ON public.commune_subscriptions(commune_id, starts_at DESC);

-- =============================================================================
-- 3. Table cancellation_requests
-- =============================================================================

CREATE TABLE public.cancellation_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  commune_id uuid NOT NULL REFERENCES public.communes(id) ON DELETE CASCADE,
  requested_by_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment text NOT NULL CHECK (char_length(comment) >= 10),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processed', 'rejected')),
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_cancellation_requests_commune
  ON public.cancellation_requests(commune_id, created_at DESC);

-- =============================================================================
-- 4. Table email_templates
-- =============================================================================

CREATE TABLE public.email_templates (
  slug text PRIMARY KEY,
  subject text NOT NULL,
  body_html text NOT NULL,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 5. RLS policies
-- =============================================================================

ALTER TABLE public.commune_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cancellation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- commune_subscriptions: SELECT for platform_admin + municipality_staff of the commune
CREATE POLICY commune_subscriptions_select ON public.commune_subscriptions FOR SELECT
USING (
  public.is_platform_admin()
  OR public.is_municipality_staff_for_commune(commune_id)
);

-- commune_subscriptions: INSERT/UPDATE/DELETE for platform_admin only
CREATE POLICY commune_subscriptions_write ON public.commune_subscriptions FOR ALL
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

-- cancellation_requests: SELECT for platform_admin + municipality_staff
CREATE POLICY cancellation_requests_select ON public.cancellation_requests FOR SELECT
USING (
  public.is_platform_admin()
  OR public.is_municipality_staff_for_commune(commune_id)
);

-- cancellation_requests: INSERT for municipality_staff
CREATE POLICY cancellation_requests_insert ON public.cancellation_requests FOR INSERT
WITH CHECK (
  public.is_municipality_staff_for_commune(commune_id)
  OR public.is_platform_admin()
);

-- cancellation_requests: UPDATE for platform_admin only
CREATE POLICY cancellation_requests_update ON public.cancellation_requests FOR UPDATE
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

-- email_templates: SELECT/UPDATE for platform_admin only
CREATE POLICY email_templates_select ON public.email_templates FOR SELECT
USING (public.is_platform_admin());

CREATE POLICY email_templates_write ON public.email_templates FOR ALL
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

-- =============================================================================
-- 6. Grants
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.commune_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cancellation_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_templates TO authenticated;

-- =============================================================================
-- 7. Seed initial email templates
-- =============================================================================

INSERT INTO public.email_templates (slug, subject, body_html, description)
VALUES
  (
    'cancellation-request-admin',
    'Demande de résiliation - {{commune_name}}',
    '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #252630; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .header img { height: 40px; }
    .content { background: #f5f5f6; border-radius: 12px; padding: 24px; }
    .label { font-size: 12px; color: #7d7e8d; text-transform: uppercase; margin-bottom: 4px; }
    .value { font-size: 16px; font-weight: 500; margin-bottom: 16px; }
    .comment { background: white; border-radius: 8px; padding: 16px; margin-top: 16px; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #7d7e8d; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{logo_url}}" alt="{{app_name}}">
    </div>
    <h2>Nouvelle demande de résiliation</h2>
    <div class="content">
      <div class="label">Commune</div>
      <div class="value">{{commune_name}} ({{commune_postcode}})</div>
      <div class="label">Demandé par</div>
      <div class="value">{{user_name}} ({{user_email}})</div>
      <div class="label">Date de la demande</div>
      <div class="value">{{request_date}}</div>
      <div class="label">Commentaire</div>
      <div class="comment">{{comment}}</div>
    </div>
    <div class="footer">
      <p>{{app_name}} — Découvrir · Partager · S''entraider</p>
    </div>
  </div>
</body>
</html>',
    'Email envoyé à l''admin plateforme lors d''une demande de résiliation'
  ),
  (
    'cancellation-confirmation-staff',
    'Confirmation de votre demande de résiliation - {{commune_name}}',
    '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #252630; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .header img { height: 40px; }
    .content { background: #f5f5f6; border-radius: 12px; padding: 24px; }
    .info { background: #fff7ed; border-left: 4px solid #ffb347; padding: 16px; border-radius: 0 8px 8px 0; margin: 16px 0; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #7d7e8d; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{logo_url}}" alt="{{app_name}}">
    </div>
    <h2>Demande de résiliation enregistrée</h2>
    <p>Bonjour {{user_name}},</p>
    <p>Nous avons bien reçu la demande de résiliation pour la commune de <strong>{{commune_name}}</strong>.</p>
    <div class="info">
      <strong>Important :</strong> L''abonnement restera actif jusqu''à la fin de la période en cours ({{subscription_end_date}}). Le renouvellement automatique a été désactivé.
    </div>
    <div class="content">
      <p><strong>Commentaire :</strong></p>
      <p>{{comment}}</p>
    </div>
    <p>Si cette demande a été faite par erreur, contactez-nous rapidement pour annuler la résiliation.</p>
    <div class="footer">
      <p>{{app_name}} — Découvrir · Partager · S''entraider</p>
    </div>
  </div>
</body>
</html>',
    'Email de confirmation envoyé aux administrateurs de la commune après une demande de résiliation'
  )
ON CONFLICT (slug) DO UPDATE SET
  subject = excluded.subject,
  body_html = excluded.body_html,
  description = excluded.description;
