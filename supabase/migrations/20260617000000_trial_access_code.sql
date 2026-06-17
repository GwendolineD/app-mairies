-- Trial access code: gated signup for communes in trial mode.
-- Adds trial_access_code and trial_max_members columns to communes,
-- and seeds the trial-invitation email template.

-- =============================================================================
-- 1. Add columns to communes
-- =============================================================================

ALTER TABLE public.communes
  ADD COLUMN IF NOT EXISTS trial_access_code text,
  ADD COLUMN IF NOT EXISTS trial_max_members integer NOT NULL DEFAULT 30;

CREATE UNIQUE INDEX IF NOT EXISTS idx_communes_trial_access_code
  ON public.communes (trial_access_code)
  WHERE trial_access_code IS NOT NULL;

-- =============================================================================
-- 2. Seed trial-invitation email template
-- =============================================================================

INSERT INTO public.email_templates (slug, subject, body_html, description)
VALUES (
  'trial-invitation',
  'Rejoignez {{commune_name}} sur Vie Locale — Votre code d''accès',
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
    .code-box { background: white; border: 2px dashed #9A52FF; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
    .code { font-size: 32px; font-weight: bold; color: #9A52FF; letter-spacing: 4px; }
    .cta { display: inline-block; background: linear-gradient(135deg, #FF7FCB, #9A52FF); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin-top: 16px; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #7d7e8d; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{logo_url}}" alt="{{app_name}}">
    </div>
    <h2>Vous êtes invité·e à rejoindre {{commune_name}} !</h2>
    <p>La commune de <strong>{{commune_name}}</strong> teste actuellement {{app_name}}, la plateforme de proximité pour découvrir, partager et s''entraider entre voisins.</p>
    <div class="content">
      <p>Pour créer votre compte, utilisez le code d''accès suivant :</p>
      <div class="code-box">
        <div class="code">{{access_code}}</div>
      </div>
      <p style="text-align:center;">
        <a href="{{signup_url}}" class="cta">Créer mon compte</a>
      </p>
    </div>
    <p style="margin-top: 20px; font-size: 14px;">Ce code est réservé aux personnes invitées pendant la phase de test. Ne le partagez qu''avec les personnes autorisées.</p>
    <div class="footer">
      <p>{{app_name}} — Découvrir · Partager · S''entraider</p>
    </div>
  </div>
</body>
</html>',
  'Email d''invitation envoyé aux testeurs pendant la période d''essai d''une commune'
)
ON CONFLICT (slug) DO UPDATE SET
  subject = excluded.subject,
  body_html = excluded.body_html,
  description = excluded.description;
