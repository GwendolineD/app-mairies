"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SupportRequestStatus } from "@/lib/types";

export type StaffReviewTable = "support_requests" | "commune_interest_leads";

const BACKOFFICE_LAYOUT_PATH = "/backoffice";

export async function updateStaffReviewRecord(opts: {
  table: StaffReviewTable;
  id: string;
  status: SupportRequestStatus;
  adminComment?: string;
  reviewerUserId: string;
  revalidatePaths: string[];
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const adminComment = opts.adminComment?.trim() || null;
  const isUnread = opts.status === "new";

  const { error } = await supabase
    .from(opts.table)
    .update({
      status: opts.status,
      admin_comment: adminComment,
      reviewed_at: isUnread ? null : new Date().toISOString(),
      reviewed_by_user_id: isUnread ? null : opts.reviewerUserId,
    })
    .eq("id", opts.id);

  if (error) {
    return { success: false, error: error.message };
  }

  for (const path of opts.revalidatePaths) {
    revalidatePath(path);
  }
  revalidatePath(BACKOFFICE_LAYOUT_PATH, "layout");

  return { success: true };
}
