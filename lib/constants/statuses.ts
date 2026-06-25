import { formatCompactShortDate } from "@/lib/utils/format-date";
import type { ReportResolutionMeta } from "@/lib/queries/report-resolution-meta";

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

export type ReportResolutionValue =
  (typeof REPORT_RESOLUTION)[keyof typeof REPORT_RESOLUTION];

const REPORT_RESOLUTION_LABELS: Record<ReportResolutionValue, string> = {
  content_suspended: "Contenu suspendu",
  user_suspended: "Auteur suspendu",
  dismissed: "Ignoré",
};

const REPORT_STATUS_BADGE_PENDING =
  "ml-auto shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase bg-coral/10 text-coral";

const REPORT_STATUS_BADGE_REVIEWED_BASE =
  "ml-auto inline-flex shrink-0 max-w-full flex-col items-end rounded-full px-2.5 py-1 text-[10px] font-bold leading-tight text-right";

const REPORT_STATUS_BADGE_CLASSES = {
  pending: REPORT_STATUS_BADGE_PENDING,
  content_suspended: `${REPORT_STATUS_BADGE_REVIEWED_BASE} bg-orange/10 text-orange`,
  user_suspended: `${REPORT_STATUS_BADGE_REVIEWED_BASE} bg-pink/10 text-pink`,
  dismissed: `${REPORT_STATUS_BADGE_REVIEWED_BASE} bg-mint/30 text-mint`,
  reviewed: `${REPORT_STATUS_BADGE_REVIEWED_BASE} bg-purple/10 text-purple`,
} as const;

export function getReportResolutionLabel(
  resolution: string | null | undefined,
): string {
  if (!resolution) return "Traité";
  if (resolution in REPORT_RESOLUTION_LABELS) {
    return REPORT_RESOLUTION_LABELS[resolution as ReportResolutionValue];
  }
  return "Traité";
}

export type ReportResolutionBadgeContent =
  | { variant: "single"; label: string }
  | { variant: "split"; headline: string; byline: string };

export function getReportResolutionBadgeContent(
  status: string,
  resolution: string | null | undefined,
  meta?: ReportResolutionMeta | null,
): ReportResolutionBadgeContent {
  if (status === "pending") {
    return { variant: "single", label: "En attente" };
  }

  const base = getReportResolutionLabel(resolution);
  if (!meta) return { variant: "single", label: base };

  if (meta.at && meta.actorName) {
    return {
      variant: "split",
      headline: `${base} le ${formatCompactShortDate(meta.at)}`,
      byline: `par ${meta.actorName}`,
    };
  }

  if (meta.at) {
    return {
      variant: "single",
      label: `${base} le ${formatCompactShortDate(meta.at)}`,
    };
  }

  return { variant: "single", label: base };
}

export function getReportStatusBadgeClassName(
  status: string,
  resolution: string | null | undefined,
): string {
  if (status === "pending") {
    return REPORT_STATUS_BADGE_CLASSES.pending;
  }

  if (resolution === REPORT_RESOLUTION.content_suspended) {
    return REPORT_STATUS_BADGE_CLASSES.content_suspended;
  }
  if (resolution === REPORT_RESOLUTION.user_suspended) {
    return REPORT_STATUS_BADGE_CLASSES.user_suspended;
  }
  if (resolution === REPORT_RESOLUTION.dismissed) {
    return REPORT_STATUS_BADGE_CLASSES.dismissed;
  }

  return REPORT_STATUS_BADGE_CLASSES.reviewed;
}

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
