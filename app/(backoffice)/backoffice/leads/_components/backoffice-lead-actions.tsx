"use client";

import {
  updateCommuneInterestLeadStatus,
} from "@/lib/actions/commune-interest-leads";
import type { SupportRequestStatus } from "@/lib/types";
import { BackofficeStaffReviewActions } from "@/components/features/backoffice/backoffice-staff-review-actions";

type Props = {
  leadId: string;
  status: SupportRequestStatus;
  initialComment?: string | null;
};

export function BackofficeLeadActions({
  leadId,
  status,
  initialComment = "",
}: Props) {
  return (
    <BackofficeStaffReviewActions
      status={status}
      initialComment={initialComment}
      resolveButtonLabel="Contacté"
      onMarkNew={(comment) => updateCommuneInterestLeadStatus(leadId, "new", comment)}
      onInProgress={(comment) => updateCommuneInterestLeadStatus(leadId, "in_progress", comment)}
      onResolve={(comment) => updateCommuneInterestLeadStatus(leadId, "resolved", comment)}
      onDismiss={(comment) => updateCommuneInterestLeadStatus(leadId, "dismissed", comment)}
    />
  );
}
