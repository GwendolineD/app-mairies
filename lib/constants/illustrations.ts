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
      "https://res.cloudinary.com/du3ko16j1/image/upload/v1780305075/app-mairies/illustrations/logos/logo-horizontal4_cezuwb.png",
    inscription: {
      interet: {
        communeSuggestion: "",
      },
    },
  },

  resident: {
    header: {
      logoHorizontal:
        "https://res.cloudinary.com/du3ko16j1/image/upload/v1780305075/app-mairies/illustrations/logos/logo-horizontal4_cezuwb.png",
    },
    accueil: {
      nudgeEmpathique:
        "https://res.cloudinary.com/du3ko16j1/image/upload/v1779975389/app-mairies/illustrations/autres/hero-community_zweexd.png",
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
