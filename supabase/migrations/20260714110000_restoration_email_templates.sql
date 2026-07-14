-- Seed moderation restoration email templates.

INSERT INTO public.email_templates (slug, subject, body_html, description)
VALUES
(
  'user-restored',
  'Votre accès à {{app_name}} a été rétabli',
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
    <h2>Bonne nouvelle, {{user_name}} !</h2>
    <div class="content">
      <p>{{restoration_summary}}</p>
      <p>Vous pouvez à nouveau profiter de {{app_name}} et retrouver votre communauté locale.</p>
      <p style="text-align:center;">
        <a href="{{app_url}}" class="cta">Retourner sur {{app_name}}</a>
      </p>
      <p style="text-align:center; margin-top: 12px;">
        <a href="mailto:{{support_email}}" style="color: #9A52FF; text-decoration: none;">Contacter le support</a>
      </p>
    </div>
    <div class="footer">
      <p>{{app_name}} — Découvrir · Partager · S''entraider</p>
    </div>
  </div>
</body>
</html>',
  'Envoyé lors de la réactivation d''une adhésion ou du déban d''un utilisateur.'
),
(
  'content-restored',
  'Votre contenu est de nouveau visible sur {{commune_name}}',
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
    <h2>Votre contenu est de nouveau visible</h2>
    <div class="content">
      <p>Bonjour {{user_name}},</p>
      <p>Votre contenu <strong>« {{content_title}} »</strong> ({{content_type}}) publié sur <strong>{{commune_name}}</strong> a été rétabli par notre équipe de modération.</p>
      <p>Il est à nouveau visible par les habitants de votre commune.</p>
      <p style="text-align:center;">
        <a href="{{content_url}}" class="cta">Voir le contenu</a>
      </p>
      <p style="text-align:center; margin-top: 12px;">
        <a href="mailto:{{support_email}}" style="color: #9A52FF; text-decoration: none;">Contacter le support</a>
      </p>
    </div>
    <div class="footer">
      <p>{{app_name}} — Découvrir · Partager · S''entraider</p>
    </div>
  </div>
</body>
</html>',
  'Envoyé à l''auteur lorsqu''un contenu (annonce, initiative, événement) est réactivé par la modération.'
)
ON CONFLICT (slug) DO UPDATE SET
  subject = excluded.subject,
  body_html = excluded.body_html,
  description = excluded.description;
