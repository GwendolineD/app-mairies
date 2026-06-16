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
<<<<<<< HEAD
  messages: "/messages",
  messageThread: (id: string) => `/messages/${id}`,
=======
  messages: {
    list: "/messages",
    trash: "/messages?vue=corbeille",
    detail: (id: string) => `/messages/${id}`,
  },
>>>>>>> preprod
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
    annonces: "/mairie/annonces",
    annonceDetail: (id: string) => `/mairie/annonces/${id}`,
    initiatives: "/mairie/initiatives",
    initiativeDetail: (id: string) => `/mairie/initiatives/${id}`,
    evenements: "/mairie/evenements",
    evenementDetail: (id: string) => `/mairie/evenements/${id}`,
    parametres: "/mairie/parametres",
    signalements: "/mairie/signalements",
    eventNew: "/mairie/evenements/nouveau",
    abonnement: "/mairie/abonnement",
  },
<<<<<<< HEAD
  platform: {
    admin: "/platform/admin",
    clients: "/platform/clients",
    clientDetail: (id: string) => `/platform/clients/${id}`,
    clientNew: "/platform/clients/nouveau",
    leads: "/platform/leads",
    stats: "/platform/stats",
=======
  backoffice: {
    admin: "/backoffice/admin",
    communes: "/backoffice/communes",
    communeDetail: (id: string) => `/backoffice/communes/${id}`,
    userDetail: (id: string) => `/backoffice/users/${id}`,
    leads: "/backoffice/leads",
    emails: "/backoffice/emails",
    categories: "/backoffice/categories",
>>>>>>> preprod
  },
} as const;

export const RESIDENT_BOTTOM_NAV = [
  { href: ROUTES.accueil, label: "Accueil" },
  { href: ROUTES.annonces.list, label: "Annonces" },
  { href: ROUTES.initiatives.list, label: "Initiatives" },
  { href: ROUTES.evenements.list, label: "Événements" },
  { href: ROUTES.messages, label: "Messages" },
] as const;

<<<<<<< HEAD
export const MUNICIPALITY_NAV = [
  { href: ROUTES.mairie.dashboard, label: "Tableau de bord" },
  { href: ROUTES.mairie.habitants, label: "Habitant·es" },
  { href: ROUTES.mairie.annonces, label: "Annonces" },
  { href: ROUTES.mairie.initiatives, label: "Initiatives" },
  { href: ROUTES.mairie.evenements, label: "Événements" },
  { href: ROUTES.mairie.signalements, label: "Signalements" },
  { href: ROUTES.mairie.parametres, label: "Paramètres" },
  { href: ROUTES.mairie.eventNew, label: "+ Événement" },
] as const;

export const PLATFORM_NAV = [
  { href: ROUTES.platform.admin, label: "Vue d'ensemble" },
  { href: ROUTES.platform.clients, label: "Clients (communes)" },
  { href: ROUTES.platform.stats, label: "Statistiques & revenus" },
  { href: ROUTES.platform.leads, label: "Leads pré-inscription" },
] as const;
=======
export const RESIDENT_BACKOFFICE_NAV = {
  mairie: {
    id: "mairie",
    href: ROUTES.mairie.dashboard,
    label: "Espace mairie",
  },
  backoffice: {
    id: "backoffice",
    href: ROUTES.backoffice.admin,
    label: "Backoffice",
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
  | "flame"
  | "credit-card"
  | "tags";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: AdminNavIcon;
};

export const MUNICIPALITY_SIDEBAR_STORAGE_KEY = "vl:municipality-sidebar-collapsed";
export const BACKOFFICE_SIDEBAR_STORAGE_KEY = "vl:backoffice-sidebar-collapsed";

export const MUNICIPALITY_NAV: readonly AdminNavItem[] = [
  { href: ROUTES.mairie.dashboard, label: "Tableau mairie", icon: "layout-dashboard" },
  { href: ROUTES.mairie.habitants, label: "Habitant·es", icon: "users" },
  { href: ROUTES.mairie.parametres, label: "Paramètres", icon: "settings" },
  { href: ROUTES.mairie.signalements, label: "Signalements", icon: "flag" },
  { href: ROUTES.mairie.eventNew, label: "+ Événement", icon: "calendar-plus" },
  { href: ROUTES.mairie.abonnement, label: "Abonnement", icon: "credit-card" },
];

export const BACKOFFICE_NAV: readonly AdminNavItem[] = [
  { href: ROUTES.backoffice.admin, label: "Dashboard", icon: "layout-dashboard" },
  { href: ROUTES.backoffice.communes, label: "Communes pilotées", icon: "building2" },
  { href: ROUTES.backoffice.categories, label: "Catégories annonces", icon: "tags" },
  { href: ROUTES.backoffice.leads, label: "Leads pré-inscription", icon: "flame" },
  { href: ROUTES.backoffice.emails, label: "Templates email", icon: "mail" },
];
>>>>>>> preprod
