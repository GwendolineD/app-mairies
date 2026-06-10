export const ANNOUNCEMENT_STATUS = {
  ouverte: "ouverte",
  pourvue: "pourvue",
  archivee: "archivee",
  expiree: "expiree",
} as const;

export type AnnouncementStatusValue =
  (typeof ANNOUNCEMENT_STATUS)[keyof typeof ANNOUNCEMENT_STATUS];

export const EVENT_STATUS = {
  active: "active",
  archived: "archived",
} as const;

export const INITIATIVE_STATUS = {
  active: "active",
  archived: "archived",
} as const;

export const REPORT_STATUS = {
  pending: "pending",
} as const;

export const MEMBERSHIP_STATUS = {
  active: "active",
  suspended: "suspended",
  left: "left",
} as const;

export const SUBSCRIPTION_STATUS = {
  inactive: "inactive",
  trial: "trial",
  active: "active",
  suspended: "suspended",
} as const;

export const SUBSCRIPTION_STATUS_VALUES = [
  "inactive",
  "trial",
  "active",
  "suspended",
] as const;

export const SUBSCRIPTION_STATUS_LABEL: Record<string, string> = {
  inactive: "Inactive",
  trial: "Essai",
  active: "Active",
  suspended: "Suspendue",
};

export const COMMUNE_PLAN = {
  free: "free",
  standard: "standard",
  premium: "premium",
} as const;

export const COMMUNE_PLAN_VALUES = ["free", "standard", "premium"] as const;

export const COMMUNE_PLAN_LABEL: Record<string, string> = {
  free: "Gratuit",
  standard: "Standard",
  premium: "Premium",
};

/** Default monthly price (in cents) suggested when assigning a plan. */
export const COMMUNE_PLAN_DEFAULT_CENTS: Record<string, number> = {
  free: 0,
  standard: 4900,
  premium: 9900,
};

export const PAYMENT_STATUS = {
  paid: "paid",
  pending: "pending",
  failed: "failed",
  refunded: "refunded",
} as const;

export const PAYMENT_STATUS_VALUES = [
  "paid",
  "pending",
  "failed",
  "refunded",
] as const;

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  paid: "Payé",
  pending: "En attente",
  failed: "Échec",
  refunded: "Remboursé",
};
