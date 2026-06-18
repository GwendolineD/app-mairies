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
    comment: "Ceci est un commentaire de test pour prévisualiser le rendu.",
    access_code: "VL-KAMET",
    signup_url: "http://localhost:3000/inscription?commune=27027&code=VL-KAMET",
    logo_url: "https://via.placeholder.com/120x40?text=Vie+Locale",
    app_name: "Vie Locale",
  };
  return mocks[variable] ?? `[${variable}]`;
}
