export const ACCESS_STATUS = {
  inactive: "inactive",
  trial: "trial",
  active: "active",
} as const;

export const PILOT_ACCESS_STATUSES = [
  ACCESS_STATUS.trial,
  ACCESS_STATUS.active,
] as const;

export const ACCESS_STATUS_LABELS: Record<
  (typeof ACCESS_STATUS)[keyof typeof ACCESS_STATUS],
  string
> = {
  inactive: "Inactive",
  trial: "Essai",
  active: "Active",
};

export const ACCESS_STATUS_CHANGE_DISCLAIMERS: Record<
  (typeof ACCESS_STATUS)[keyof typeof ACCESS_STATUS],
  string
> = {
  inactive:
    "La commune sera retirée du pilotage : elle n'apparaîtra plus dans les listes actives et les habitant·es ne pourront plus s'y inscrire ni y accéder.",
  trial:
    "La commune passera en mode essai : elle restera visible dans le backoffice comme commune pilote en test, avec un accès limité pour les habitant·es.",
  active:
    "La commune sera pleinement ouverte : inscription et accès résident·es activés pour tous les habitant·es de la commune.",
};

export const ALL_ACCESS_STATUSES = [
  ACCESS_STATUS.inactive,
  ACCESS_STATUS.trial,
  ACCESS_STATUS.active,
] as const;

export const BACKOFFICE_COMMUNES_PAGE_SIZES = [10, 25, 50] as const;
export const DEFAULT_BACKOFFICE_COMMUNES_PAGE_SIZE = 25;

export const BACKOFFICE_MEMBERS_PAGE_SIZES = [10, 25, 50] as const;
export const DEFAULT_BACKOFFICE_MEMBERS_PAGE_SIZE = 25;
