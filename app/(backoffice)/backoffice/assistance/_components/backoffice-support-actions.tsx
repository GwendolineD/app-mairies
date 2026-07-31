"use client";

import {
  updateSupportRequestStatus,
} from "@/lib/actions/support-requests";
import type { SupportRequestStatus } from "@/lib/types";
import { BackofficeStaffReviewActions } from "@/components/features/backoffice/backoffice-staff-review-actions";

type Props = {
  requestId: string;
  status: SupportRequestStatus;
  initialComment?: string | null;
};

export function BackofficeSupportActions({
  requestId,
  status,
  initialComment = "",
}: Props) {
  return (
    <BackofficeStaffReviewActions
      status={status}
      initialComment={initialComment}
      onMarkNew={(comment) => updateSupportRequestStatus(requestId, "new", comment)}
      onInProgress={(comment) => updateSupportRequestStatus(requestId, "in_progress", comment)}
      onResolve={(comment) => updateSupportRequestStatus(requestId, "resolved", comment)}
      onDismiss={(comment) => updateSupportRequestStatus(requestId, "dismissed", comment)}
    />
  );
}
