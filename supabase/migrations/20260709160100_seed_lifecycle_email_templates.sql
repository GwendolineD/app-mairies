-- Seed lifecycle email templates for cron nudges and reminders.

INSERT INTO public.email_templates (slug, subject, body_html, description)
VALUES
(
  'invite-reminder',
  'Rappel : rejoignez {{commune_name}} sur {{app_name}} !',
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
    <h2>Vos voisins vous attendent !</h2>
    <div class="content">
      <p>Bonjour,</p>
      <p><strong>{{sender_name}}</strong> vous a invité à rejoindre {{app_name}} {{commune_name}} il y a quelques jours.</p>
      <p>Découvrez les annonces utiles, les initiatives locales et les événements de votre commune en quelques minutes.</p>
      <p style="text-align:center;">
        <a href="{{invite_link}}" class="cta">Rejoindre {{app_name}}</a>
      </p>
    </div>
    <div class="footer">
      <p>{{app_name}} — Découvrir · Partager · S''entraider</p>
      <p><a href="{{unsubscribe_link}}" style="color:#7d7e8d;">Se désinscrire</a> · <a href="{{settings_url}}" style="color:#7d7e8d;">Gérer mes préférences</a></p>
    </div>
  </div>
</body>
</html>',
  'Relance envoyée 3 jours après une invitation sans inscription'
),
(
  'engagement-first-week',
  '{{user_name}}, partagez votre première annonce sur {{commune_name}} !',
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
    <h2>Bienvenue {{user_name}} !</h2>
    <div class="content">
      <p>Vous avez rejoint {{commune_name}} sur {{app_name}} il y a quelques jours — bienvenue dans la communauté !</p>
      <p>Saviez-vous que vous pouvez publier une annonce pour demander un coup de main, proposer un service ou partager une initiative ? C''est le meilleur moyen de faire connaissance avec vos voisins.</p>
      <p style="text-align:center;">
        <a href="{{app_url}}" class="cta">Publier ma première annonce</a>
      </p>
    </div>
    <div class="footer">
      <p>{{app_name}} — Découvrir · Partager · S''entraider</p>
      <p><a href="{{unsubscribe_link}}" style="color:#7d7e8d;">Se désinscrire</a> · <a href="{{settings_url}}" style="color:#7d7e8d;">Gérer mes préférences</a></p>
    </div>
  </div>
</body>
</html>',
  'Email d''engagement envoyé aux inscrits de 3-6 jours sans publication'
),
(
  'announcement-expired-nudge',
  'Votre annonce « {{announcement_title}} » a dépassé son échéance',
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
    <h2>Échéance dépassée</h2>
    <div class="content">
      <p>Bonjour {{user_name}},</p>
      <p>L''échéance de votre annonce <strong>« {{announcement_title}} »</strong> est dépassée.</p>
      <p>Souhaitez-vous la maintenir, modifier la date ou la supprimer ?</p>
      <p style="text-align:center;">
        <a href="{{announcement_url}}" class="cta">Voir mon annonce</a>
      </p>
    </div>
    <div class="footer">
      <p>{{app_name}} — Découvrir · Partager · S''entraider</p>
      <p><a href="{{unsubscribe_link}}" style="color:#7d7e8d;">Se désinscrire</a> · <a href="{{settings_url}}" style="color:#7d7e8d;">Gérer mes préférences</a></p>
    </div>
  </div>
</body>
</html>',
  'Relance auteur d''annonce dont la date cible est dépassée de 2 jours'
),
(
  'announcement-stale-60d',
  'Votre annonce « {{announcement_title}} » est-elle toujours d''actualité ?',
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
    <h2>Votre annonce a plus de 2 mois</h2>
    <div class="content">
      <p>Bonjour {{user_name}},</p>
      <p>Votre annonce <strong>« {{announcement_title}} »</strong> est active depuis plus de 2 mois.</p>
      <p>Est-elle toujours d''actualité ? Vous pouvez la maintenir, la modifier ou la supprimer.</p>
      <p style="text-align:center;">
        <a href="{{announcement_url}}" class="cta">Voir mon annonce</a>
      </p>
    </div>
    <div class="footer">
      <p>{{app_name}} — Découvrir · Partager · S''entraider</p>
      <p><a href="{{unsubscribe_link}}" style="color:#7d7e8d;">Se désinscrire</a> · <a href="{{settings_url}}" style="color:#7d7e8d;">Gérer mes préférences</a></p>
    </div>
  </div>
</body>
</html>',
  'Relance auteur d''annonce sans date créée depuis plus de 60 jours'
),
(
  'initiative-stale-60d',
  'Votre initiative « {{initiative_title}} » est-elle toujours d''actualité ?',
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
    <h2>Votre initiative a plus de 2 mois</h2>
    <div class="content">
      <p>Bonjour {{user_name}},</p>
      <p>Votre initiative <strong>« {{initiative_title}} »</strong> est active depuis plus de 2 mois.</p>
      <p>Est-elle toujours d''actualité ? Vous pouvez la maintenir ou la supprimer.</p>
      <p style="text-align:center;">
        <a href="{{initiative_url}}" class="cta">Voir mon initiative</a>
      </p>
    </div>
    <div class="footer">
      <p>{{app_name}} — Découvrir · Partager · S''entraider</p>
      <p><a href="{{unsubscribe_link}}" style="color:#7d7e8d;">Se désinscrire</a> · <a href="{{settings_url}}" style="color:#7d7e8d;">Gérer mes préférences</a></p>
    </div>
  </div>
</body>
</html>',
  'Relance auteur d''initiative active depuis plus de 60 jours'
),
(
  'event-past-nudge',
  'Votre événement « {{event_title}} » est terminé',
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
    <h2>Événement terminé</h2>
    <div class="content">
      <p>Bonjour {{user_name}},</p>
      <p>Votre événement <strong>« {{event_title}} »</strong> est terminé depuis 2 jours.</p>
      <p>Souhaitez-vous le supprimer ou le conserver dans l''historique ?</p>
      <p style="text-align:center;">
        <a href="{{event_url}}" class="cta">Voir mon événement</a>
      </p>
    </div>
    <div class="footer">
      <p>{{app_name}} — Découvrir · Partager · S''entraider</p>
      <p><a href="{{unsubscribe_link}}" style="color:#7d7e8d;">Se désinscrire</a> · <a href="{{settings_url}}" style="color:#7d7e8d;">Gérer mes préférences</a></p>
    </div>
  </div>
</body>
</html>',
  'Relance auteur d''événement dont la date de fin est passée de 2 jours'
),
(
  'notification-activation-reminder',
  '{{user_name}}, activez les notifications pour ne rien manquer !',
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
    <h2>Ne manquez rien dans votre commune !</h2>
    <div class="content">
      <p>Bonjour {{user_name}},</p>
      <p>Vous avez rejoint {{commune_name}} sur {{app_name}} — super ! Pour être prévenu dès qu''un voisin publie une annonce ou un événement, activez les notifications.</p>
      <p>Cela prend 10 secondes et vous pouvez les désactiver à tout moment.</p>
      <p style="text-align:center;">
        <a href="{{settings_url}}" class="cta">Activer les notifications</a>
      </p>
    </div>
    <div class="footer">
      <p>{{app_name}} — Découvrir · Partager · S''entraider</p>
      <p><a href="{{unsubscribe_link}}" style="color:#7d7e8d;">Se désinscrire</a> · <a href="{{settings_url}}" style="color:#7d7e8d;">Gérer mes préférences</a></p>
    </div>
  </div>
</body>
</html>',
  'Rappel d''activation des notifications pour les inscrits de moins de 7 jours'
)
ON CONFLICT (slug) DO UPDATE SET
  subject = excluded.subject,
  body_html = excluded.body_html,
  description = excluded.description;
