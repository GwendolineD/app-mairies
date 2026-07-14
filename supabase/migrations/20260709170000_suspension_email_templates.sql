-- Seed moderation suspension/ban email templates.

INSERT INTO public.email_templates (slug, subject, body_html, description)
VALUES
(
  'content-suspended',
  'Votre contenu a été suspendu sur {{commune_name}}',
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
    .reason { background: #ffffff; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #FF6B6B; }
    .cta { display: inline-block; background: linear-gradient(135deg, #FF7FCB, #9A52FF); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin-top: 16px; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #7d7e8d; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{logo_url}}" alt="{{app_name}}">
    </div>
    <h2>Votre contenu a été suspendu</h2>
    <div class="content">
      <p>Bonjour {{user_name}},</p>
      <p>Votre contenu <strong>« {{content_title}} »</strong> ({{content_type}}) publié sur <strong>{{commune_name}}</strong> a été suspendu par notre équipe de modération.</p>
      <div class="reason">
        <p><strong>Motif :</strong></p>
        <p>{{suspension_reason}}</p>
      </div>
      <p>Ce contenu n''est plus visible par les autres habitants. Si vous pensez qu''il s''agit d''une erreur, vous pouvez nous contacter.</p>
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
  'Envoyé à l''auteur lorsqu''un contenu (annonce, initiative, événement) est suspendu par la modération.'
),
(
  'user-suspended',
  'Votre accès à {{commune_name}} a été suspendu',
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
    .reason { background: #ffffff; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #FF6B6B; }
    .cta { display: inline-block; background: linear-gradient(135deg, #FF7FCB, #9A52FF); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin-top: 16px; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #7d7e8d; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{logo_url}}" alt="{{app_name}}">
    </div>
    <h2>Votre compte a été suspendu</h2>
    <div class="content">
      <p>Bonjour {{user_name}},</p>
      <p>Votre accès à <strong>{{commune_name}}</strong> sur {{app_name}} a été suspendu par notre équipe de modération.</p>
      <div class="reason">
        <p><strong>Motif :</strong></p>
        <p>{{suspension_reason}}</p>
      </div>
      <p>Vous ne pouvez plus accéder aux fonctionnalités de cette commune. Si vous pensez qu''il s''agit d''une erreur, vous pouvez demander une révision.</p>
      <p style="text-align:center;">
        <a href="{{appeal_url}}" class="cta">Demander une révision</a>
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
  'Envoyé à un utilisateur lorsque son adhésion à une commune est suspendue.'
),
(
  'user-banned',
  'Votre compte {{app_name}} a été définitivement banni',
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
    .reason { background: #ffffff; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #FF6B6B; }
    .cta { display: inline-block; background: linear-gradient(135deg, #FF7FCB, #9A52FF); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin-top: 16px; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #7d7e8d; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{logo_url}}" alt="{{app_name}}">
    </div>
    <h2>Votre compte a été banni</h2>
    <div class="content">
      <p>Bonjour {{user_name}},</p>
      <p>Votre compte sur {{app_name}} a été définitivement banni par notre équipe de modération. Vous n''avez plus accès à la plateforme.</p>
      <div class="reason">
        <p><strong>Motif :</strong></p>
        <p>{{ban_reason}}</p>
      </div>
      <p>Si vous pensez qu''il s''agit d''une erreur, vous pouvez nous contacter.</p>
      <p style="text-align:center;">
        <a href="mailto:{{support_email}}" class="cta">Contacter le support</a>
      </p>
    </div>
    <div class="footer">
      <p>{{app_name}} — Découvrir · Partager · S''entraider</p>
    </div>
  </div>
</body>
</html>',
  'Envoyé à un utilisateur lorsqu''il est banni de la plateforme (ban définitif).'
)
ON CONFLICT (slug) DO UPDATE SET
  subject = excluded.subject,
  body_html = excluded.body_html,
  description = excluded.description;
