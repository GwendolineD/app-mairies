export const NEIGHBOR_INVITE_TEMPLATE_KEY = "neighbor_invite" as const;

export const DEFAULT_NEIGHBOR_INVITE_TEMPLATE = {
  subject: "{{sender_name}} vous invite sur Vie Locale {{commune_name}}",
  preheader:
    "Un espace local pour découvrir les initiatives, partager des annonces et s'entraider entre voisins.",
  bodyMarkdown:
    "Bonjour,\n\n{{sender_name}} vous invite à rejoindre Vie Locale {{commune_name}}, l'espace convivial pour découvrir ce qui se passe près de chez vous, proposer un coup de main et rencontrer des voisins bienveillants.\n\nEn quelques minutes, vous pourrez voir les annonces utiles, les initiatives locales et les événements de la commune.\n\n{{invite_link}}\n\nÀ très vite sur Vie Locale !",
  ctaLabel: "Rejoindre Vie Locale",
};

export const EMAIL_TEMPLATE_PLACEHOLDERS = [
  "{{sender_name}}",
  "{{commune_name}}",
  "{{invite_link}}",
] as const;
