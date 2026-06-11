import type { AnnouncementType } from "@/lib/constants/announcement-types";

export const ROUTES = {
  home: "/",
  connexion: "/connexion",
  connexionForgotPassword: "/connexion/mot-de-passe-oublie",
  connexionNewPassword: "/connexion/nouveau-mot-de-passe",
  authCallback: "/auth/callback",
  inscription: {
    root: "/inscription",
    commune: "/inscription/commune",
    interet: "/inscription/interet",
  },
  accueil: "/accueil",
  suspendu: "/suspendu",
  profil: "/profil",
  messages: {
    list: "/messages",
    detail: (id: string) => `/messages/${id}`,
  },
  annonces: {
    list: "/annonces",
    map: "/annonces/carte",
    new: (type?: AnnouncementType) =>
      type
        ? `/annonces/nouvelle?type=${type}`
        : "/annonces/nouvelle",
    detail: (id: string) => `/annonces/${id}`,
  },
  initiatives: {
    list: "/initiatives",
    new: "/initiatives/nouvelle",
    detail: (id: string) => `/initiatives/${id}`,
  },
  evenements: {
    list: "/evenements",
    detail: (id: string) => `/evenements/${id}`,
  },
  mairie: {
    dashboard: "/mairie",
    habitants: "/mairie/habitants",
    parametres: "/mairie/parametres",
    signalements: "/mairie/signalements",
    eventNew: "/mairie/evenements/nouveau",
  },
  platform: {
    admin: "/platform/admin",
    communes: "/platform/communes",
    leads: "/platform/leads",
    stats: "/platform/stats",
  },
} as const;

export const RESIDENT_BOTTOM_NAV = [
  { href: ROUTES.accueil, label: "Accueil" },
  { href: ROUTES.annonces.list, label: "Annonces" },
  { href: ROUTES.initiatives.list, label: "Initiatives" },
  { href: ROUTES.evenements.list, label: "Événements" },
  { href: ROUTES.messages.list, label: "Messages" },
] as const;

export const RESIDENT_BACKOFFICE_NAV = {
  mairie: {
    id: "mairie",
    href: ROUTES.mairie.dashboard,
    label: "Espace mairie",
  },
  platform: {
    id: "platform",
    href: ROUTES.platform.admin,
    label: "Admin plateforme",
  },
} as const;

export type AdminNavIcon =
  | "layout-dashboard"
  | "users"
  | "settings"
  | "flag"
  | "calendar-plus"
  | "building2"
  | "mail"
  | "bar-chart3";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: AdminNavIcon;
};

export const MUNICIPALITY_SIDEBAR_STORAGE_KEY = "vl:municipality-sidebar-collapsed";
export const PLATFORM_SIDEBAR_STORAGE_KEY = "vl:platform-sidebar-collapsed";

export const MUNICIPALITY_NAV: readonly AdminNavItem[] = [
  { href: ROUTES.mairie.dashboard, label: "Tableau mairie", icon: "layout-dashboard" },
  { href: ROUTES.mairie.habitants, label: "Habitant·es", icon: "users" },
  { href: ROUTES.mairie.parametres, label: "Paramètres", icon: "settings" },
  { href: ROUTES.mairie.signalements, label: "Signalements", icon: "flag" },
  { href: ROUTES.mairie.eventNew, label: "+ Événement", icon: "calendar-plus" },
];

export const PLATFORM_NAV: readonly AdminNavItem[] = [
  { href: ROUTES.platform.admin, label: "Vue d'ensemble", icon: "layout-dashboard" },
  { href: ROUTES.platform.communes, label: "Communes pilotées", icon: "building2" },
  { href: ROUTES.platform.leads, label: "Leads pré-inscription", icon: "mail" },
  { href: ROUTES.platform.stats, label: "Statistiques", icon: "bar-chart3" },
];
