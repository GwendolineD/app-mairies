-- Email template: notify initiative supporters when the initiative becomes an event.

INSERT INTO public.email_templates (slug, subject, body_html, description)
VALUES (
  'initiative-to-event',
  'L''initiative « {{initiative_title}} » se concrétise !',
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
    .cta { display: inline-block; background: linear-gradient(135deg, #74E3B2, #35D1D1); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin-top: 16px; }
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
      <p>L''initiative <strong>« {{initiative_title}} »</strong> que vous avez soutenue se concrétise.</p>
      <p><strong>{{author_name}}</strong> organise l''événement <strong>« {{event_title}} »</strong> le <strong>{{event_date}}</strong> à {{commune_name}}.</p>
      <p>Venez participer et retrouvez vos voisins !</p>
      <p style="text-align:center;">
        <a href="{{event_url}}" class="cta">Voir l''événement</a>
      </p>
    </div>
    <div class="footer">
      <p>{{app_name}} — Découvrir · Partager · S''entraider</p>
      <p><a href="{{unsubscribe_link}}" style="color:#7d7e8d;">Se désinscrire</a> · <a href="{{settings_url}}" style="color:#7d7e8d;">Gérer mes préférences</a></p>
    </div>
  </div>
</body>
</html>',
  'Envoyé aux supporters d''une initiative quand celle-ci est transformée en événement'
);
