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
