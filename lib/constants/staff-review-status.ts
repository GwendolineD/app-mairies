import type { SupportRequestStatus } from "@/lib/types";

export type StaffReviewStatus = SupportRequestStatus;

export type StaffReviewStatusMeta = {
  label: string;
  className: string;
};

export const STAFF_REVIEW_STATUS_LABELS: Record<
  StaffReviewStatus,
  StaffReviewStatusMeta
> = {
  new: {
    label: "Non lu",
    className: "bg-coral/10 text-coral",
  },
  in_progress: {
    label: "En cours",
    className: "bg-purple/10 text-purple",
  },
  resolved: {
    label: "Résolu",
    className: "bg-mint/10 text-mint",
  },
  dismissed: {
    label: "Ignoré",
    className: "bg-warm text-muted",
  },
};

export const LEAD_STAFF_REVIEW_STATUS_LABELS = getStaffReviewStatusLabels({
  resolved: {
    label: "Contacté",
    className: STAFF_REVIEW_STATUS_LABELS.resolved.className,
  },
});

export function getStaffReviewStatusLabels(
  overrides?: Partial<Record<StaffReviewStatus, Partial<StaffReviewStatusMeta>>>,
): Record<StaffReviewStatus, StaffReviewStatusMeta> {
  return {
    new: { ...STAFF_REVIEW_STATUS_LABELS.new, ...overrides?.new },
    in_progress: {
      ...STAFF_REVIEW_STATUS_LABELS.in_progress,
      ...overrides?.in_progress,
    },
    resolved: {
      ...STAFF_REVIEW_STATUS_LABELS.resolved,
      ...overrides?.resolved,
    },
    dismissed: {
      ...STAFF_REVIEW_STATUS_LABELS.dismissed,
      ...overrides?.dismissed,
    },
  };
}

export function isOpenStaffReviewStatus(status: StaffReviewStatus): boolean {
  return status === "new" || status === "in_progress";
}
