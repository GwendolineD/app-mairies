-- Move neighbor invite email template to platform-wide email_templates table
-- so it becomes editable from the backoffice /emails page.

INSERT INTO public.email_templates (slug, subject, body_html, description)
VALUES (
  'neighbor-invite',
  '{{sender_name}} vous invite sur Vie Locale {{commune_name}}',
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
    <h2>{{sender_name}} vous invite à rejoindre {{commune_name}} !</h2>
    <div class="content">
      <p>Bonjour,</p>
      <p><strong>{{sender_name}}</strong> vous invite à rejoindre {{app_name}} {{commune_name}}, l''espace convivial pour découvrir ce qui se passe près de chez vous, proposer un coup de main et rencontrer des voisins bienveillants.</p>
      <p>En quelques minutes, vous pourrez voir les annonces utiles, les initiatives locales et les événements de la commune.</p>
      <p style="text-align:center;">
        <a href="{{invite_link}}" class="cta">Rejoindre Vie Locale</a>
      </p>
    </div>
    <p style="margin-top: 20px; font-size: 14px;">À très vite sur {{app_name}} !</p>
    <div class="footer">
      <p>{{app_name}} — Découvrir · Partager · S''entraider</p>
    </div>
  </div>
</body>
</html>',
  'Email d''invitation envoyé par un résident à ses voisins pour rejoindre la plateforme'
)
ON CONFLICT (slug) DO UPDATE SET
  subject = excluded.subject,
  body_html = excluded.body_html,
  description = excluded.description;
