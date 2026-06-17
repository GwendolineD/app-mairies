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
  reviewed: "reviewed",
  dismissed: "dismissed",
} as const;

export const REPORT_RESOLUTION = {
  content_suspended: "content_suspended",
  user_suspended: "user_suspended",
  dismissed: "dismissed",
} as const;

export const MODERATION_ACTION = {
  suspend: "suspend",
  reactivate: "reactivate",
  ban: "ban",
  unban: "unban",
} as const;

export const MEMBERSHIP_STATUS = {
  active: "active",
  suspended: "suspended",
  left: "left",
} as const;
