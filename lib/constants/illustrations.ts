/**
 * Illustration URLs keyed by UI slot (where they appear in the app).
 * Update the URL here when design changes — never in page components.
 */

export const ILLUSTRATIONS = {
  landing: {},

  auth: {
    background:
      "https://res.cloudinary.com/du3ko16j1/image/upload/v1779987275/app-mairies/illustrations/autres/accueil-bg3_nnlo1u.png",
    logoHorizontal:
      "https://res.cloudinary.com/du3ko16j1/image/upload/v1779983881/app-mairies/illustrations/logos/logo-horizontal9_nymif4.png",
    inscription: {
      interet: {
        communeSuggestion: "",
      },
    },
  },

  resident: {
    accueil: {
      nudgeEmpathique: "",
    },
    messages: {
      emptyState: "",
    },
    annonces: {
      detail: {
        photoFallback: "",
        contactBlock: "",
      },
      carte: {
        legendSidebar: "",
      },
      nouvelle: {
        photoPreview: "",
      },
    },
    initiatives: {
      detail: {
        calendar: "",
      },
    },
    evenements: {
      detail: {
        hero: "",
      },
    },
  },

  municipality: {},

  platform: {},

  shared: {
    mapLoading: "",
  },
} as const;
