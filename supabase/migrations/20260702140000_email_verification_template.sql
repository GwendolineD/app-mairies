-- Email verification template (editable from backoffice /emails)

INSERT INTO public.email_templates (slug, subject, body_html, description)
VALUES (
  'email-verification',
  'Confirmez votre adresse e-mail — {{app_name}}',
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
    .cta { display: inline-block; background: linear-gradient(135deg, #FF7FCB, #9A52FF); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin-top: 16px; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #7d7e8d; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{logo_url}}" alt="{{app_name}}">
    </div>
    <h2>Bienvenue sur {{app_name}}, {{user_name}} !</h2>
    <div class="content">
      <p>Bonjour {{user_name}},</p>
      <p>Merci de vous être inscrit·e. Pour activer votre compte et rejoindre votre commune, confirmez votre adresse e-mail en cliquant sur le bouton ci-dessous.</p>
      <p style="text-align:center;">
        <a href="{{verification_link}}" class="cta">Confirmer mon adresse e-mail</a>
      </p>
      <p style="font-size: 14px; color: #7d7e8d; margin-bottom: 0;">Ce lien expire dans une heure. Tant que vous ne l''avez pas utilisé, votre compte reste inactif.</p>
    </div>
    <p style="margin-top: 20px; font-size: 14px;">Si vous n''êtes pas à l''origine de cette inscription, ignorez cet e-mail.</p>
    <div class="footer">
      <p>{{app_name}} — Découvrir · Partager · S''entraider</p>
    </div>
  </div>
</body>
</html>',
  'E-mail de confirmation d''adresse envoyé après l''inscription ou sur demande de renvoi'
)
ON CONFLICT (slug) DO UPDATE SET
  subject = excluded.subject,
  body_html = excluded.body_html,
  description = excluded.description;
