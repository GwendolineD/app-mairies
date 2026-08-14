export type ProspectConseiller = {
  nom: string;
  prenom: string;
  fonction: string;
};

import type {
  ProspectOutreach,
  ProspectOutreachListEmbed,
} from "@/lib/prospect-outreach/types";

export type GeocodeSource = "ban" | "centroid" | "failed";

export type ProspectCommuneListItem = {
  id: string;
  commune: string;
  departement: string;
  population: number;
  distance_km: number | null;
  maire: string | null;
  nombre_elus: number | null;
  adresse_mairie: string;
  postcode: string | null;
  latitude: number | null;
  longitude: number | null;
  geocode_source: GeocodeSource;
  telephones: string[];
  emails: string[];
  horaires_ouverture: string | null;
  opening_days: string[];
  insee_code: string | null;
  outreach: ProspectOutreachListEmbed;
};

export type ProspectCommuneDetail = ProspectCommuneListItem & {
  conseillers: ProspectConseiller[];
  outreach: ProspectOutreach;
};

export type ProspectCommuneImportRow = {
  commune: string;
  departement: string;
  population: number;
  distance_km: number;
  maire: string;
  conseillers: ProspectConseiller[];
  nombre_elus: number;
  adresse_mairie: string;
  telephones: string[];
  emails: string[];
  horaires_ouverture: string;
};

/** Pagination required above this count — see prospect-communes page. */
export const PROSPECT_COMMUNES_UNPAGINATED_MAX = 500;

export const PROSPECT_COMMUNE_LIST_SELECT =
  "id, commune, departement, population, distance_km, maire, nombre_elus, adresse_mairie, postcode, latitude, longitude, geocode_source, telephones, emails, horaires_ouverture, opening_days, insee_code" as const;

export const OPENING_DAY_OPTIONS = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
] as const;

export type OpeningDay = (typeof OPENING_DAY_OPTIONS)[number];

export const PROSPECT_DEPARTEMENT_OPTIONS = ["27", "28", "78"] as const;
