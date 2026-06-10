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
  messages: "/messages",
  messageThread: (id: string) => `/messages/${id}`,
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
  },
  platform: {
    admin: "/platform/admin",
    clients: "/platform/clients",
    clientDetail: (id: string) => `/platform/clients/${id}`,
    clientNew: "/platform/clients/nouveau",
    leads: "/platform/leads",
    stats: "/platform/stats",
  },
} as const;

export const RESIDENT_BOTTOM_NAV = [
  { href: ROUTES.accueil, label: "Accueil" },
  { href: ROUTES.annonces.list, label: "Annonces" },
  { href: ROUTES.initiatives.list, label: "Initiatives" },
  { href: ROUTES.evenements.list, label: "Événements" },
  { href: ROUTES.messages, label: "Messages" },
] as const;

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
