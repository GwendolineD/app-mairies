"use server";

import { requirePlatformAdmin } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { updateStaffReviewRecord } from "@/lib/actions/staff-review";
import type { SupportRequestStatus } from "@/lib/types";

export async function updateCommuneInterestLeadStatus(
  leadId: string,
  status: SupportRequestStatus,
  adminComment?: string,
): Promise<{ success: boolean; error?: string }> {
  const ctx = await requirePlatformAdmin();

  return updateStaffReviewRecord({
    table: "commune_interest_leads",
    id: leadId,
    status,
    adminComment,
    reviewerUserId: ctx.userId,
    revalidatePaths: [ROUTES.backoffice.leads],
  });
}

export async function markCommuneInterestLeadInProgress(
  leadId: string,
): Promise<{ success: boolean; error?: string }> {
  return updateCommuneInterestLeadStatus(leadId, "in_progress");
}
