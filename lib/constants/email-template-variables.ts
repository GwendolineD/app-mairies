import { APP_NAME } from "@/lib/constants/app";
import { ILLUSTRATIONS } from "@/lib/constants/illustrations";

export const EMAIL_TEMPLATE_VARIABLES: Record<string, string[]> = {
  "cancellation-request-admin": [
    "commune_name",
    "commune_postcode",
    "user_name",
    "user_email",
    "request_date",
    "comment",
    "logo_url",
    "app_name",
  ],
  "cancellation-confirmation-staff": [
    "commune_name",
    "user_name",
    "subscription_end_date",
    "comment",
    "logo_url",
    "app_name",
  ],
  "trial-invitation": [
    "commune_name",
    "access_code",
    "signup_url",
    "logo_url",
    "app_name",
  ],
  "report-notification-staff": [
    "commune_name",
    "content_type",
    "content_title",
    "reporter_name",
    "reason",
    "report_date",
    "moderation_url",
    "logo_url",
    "app_name",
  ],
  "report-notification-admin": [
    "commune_name",
    "content_type",
    "content_title",
    "reporter_name",
    "reason",
    "report_date",
    "moderation_url",
    "logo_url",
    "app_name",
  ],
  "neighbor-invite": [
    "sender_name",
    "commune_name",
    "invite_link",
    "logo_url",
    "app_name",
  ],
  "email-verification": [
    "user_name",
    "verification_link",
    "logo_url",
    "app_name",
  ],
  "content-suspended": [
    "user_name",
    "commune_name",
    "content_type",
    "content_title",
    "suspension_reason",
    "content_url",
    "support_email",
    "logo_url",
    "app_name",
  ],
  "user-suspended": [
    "user_name",
    "commune_name",
    "suspension_reason",
    "appeal_url",
    "support_email",
    "logo_url",
    "app_name",
  ],
  "user-banned": [
    "user_name",
    "ban_reason",
    "support_email",
    "logo_url",
    "app_name",
  ],
  "user-restored": [
    "user_name",
    "restoration_summary",
    "app_url",
    "support_email",
    "logo_url",
    "app_name",
  ],
  "content-restored": [
    "user_name",
    "commune_name",
    "content_type",
    "content_title",
    "content_url",
    "support_email",
    "logo_url",
    "app_name",
  ],
};

export function getEmailTemplateVariables(slug: string): string[] {
  return EMAIL_TEMPLATE_VARIABLES[slug] ?? ["logo_url", "app_name"];
}

export function getEmailTemplateMockValue(variable: string): string {
  const mocks: Record<string, string> = {
    commune_name: "Les Authieux",
    commune_postcode: "27220",
    user_name: "Jean Dupont",
    user_email: "jean.dupont@example.fr",
    request_date: "12 juin 2026",
    subscription_end_date: "31 déc. 2026",
    comment: "Première ligne du commentaire.\nDeuxième ligne pour tester les retours à la ligne.",
    access_code: "VL-KAMET",
    signup_url: "http://localhost:3000/inscription?commune=27027&code=VL-KAMET",
    content_type: "Annonce",
    content_title: "Recherche aide pour déménagement",
    reporter_name: "Marie Martin",
    reason: "Contenu inapproprié ou trompeur.\nPlusieurs passages posent problème.\nMerci de vérifier.",
    report_date: "17 juin 2026",
    moderation_url: "https://app.tous-voisins.fr/mairie/signalements",
    sender_name: "Marie Dupont",
    invite_link: "http://localhost:3000/inscription?invite=abc123def456",
    verification_link:
      "http://localhost:3000/auth/callback?type=magiclink&token_hash=example-token",
    suspension_reason:
      "Contenu ne respectant pas les règles de la communauté.\nDétails supplémentaires ici.",
    ban_reason:
      "Violation répétée des conditions d'utilisation.\nMalgré plusieurs avertissements.",
    content_url: "http://localhost:3000/annonces/abc123",
    appeal_url: "http://localhost:3000/suspendu",
    restoration_summary: "Votre accès à Les Authieux a été rétabli.",
    app_url: "http://localhost:3000/accueil",
    support_email: "support@tous-voisins.fr",
    logo_url: ILLUSTRATIONS.auth.logoHorizontal,
    app_name: APP_NAME,
  };
  return mocks[variable] ?? `[${variable}]`;
}
