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
      "https://res.cloudinary.com/du3ko16j1/image/upload/v1781795228/app-mairies/logos/logo-horizontal_uxovbe.png",
    inscription: {
      interet: {
        communeSuggestion: "",
      },
    },
  },

  resident: {
    header: {
      logoHorizontal:
        "https://res.cloudinary.com/du3ko16j1/image/upload/v1781795228/app-mairies/logos/logo-horizontal_uxovbe.png",
    },
    accueil: {
      nudgeEmpathique:
        "https://res.cloudinary.com/du3ko16j1/image/upload/v1779975389/app-mairies/illustrations/autres/hero-community_zweexd.png",
    },
    onboarding: {
      welcome:
        "https://res.cloudinary.com/du3ko16j1/image/upload/v1779987275/app-mairies/illustrations/autres/accueil-bg3_nnlo1u.png",
      heart:
        "https://res.cloudinary.com/du3ko16j1/image/upload/v1781848731/app-mairies/illustrations/autres/coeur_n9sseg.png",
      annonces:
        "https://res.cloudinary.com/du3ko16j1/image/upload/v1781850240/app-mairies/illustrations/autres/demenagement_tlyatj.png",
      initiatives:
        "https://res.cloudinary.com/du3ko16j1/image/upload/v1781850702/app-mairies/illustrations/autres/reflexion-table-avec-plateau_weilue.png",
      evenements:
        "https://res.cloudinary.com/du3ko16j1/image/upload/v1781850851/app-mairies/illustrations/autres/fete-village_u6vwxz.png",
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
    profil: {
      neighborInvite:
        "https://res.cloudinary.com/du3ko16j1/image/upload/v1781795828/app-mairies/illustrations/autres/invitation_scekel.png",
    },
  },

  municipality: {},

  platform: {},

  shared: {
    mapLoading: "",
  },
} as const;
