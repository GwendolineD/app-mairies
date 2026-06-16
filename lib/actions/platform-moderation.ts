"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { MEMBERSHIP_STATUS } from "@/lib/constants/statuses";
import { createClient } from "@/lib/supabase/server";

export type ModerationActionResult =
  | { success: true }
  | { success: false; error: string };

export async function suspendMembershipAction(
  membershipId: string,
  reason: string,
): Promise<ModerationActionResult> {
  await requirePlatformAdmin();

  const trimmedReason = reason.trim();
  if (!membershipId || !trimmedReason) {
    return { success: false, error: "Paramètres invalides." };
  }

  const supabase = await createClient();
  const { data: membership, error: fetchError } = await supabase
    .from("memberships")
    .select("id, user_id, commune_id, status")
    .eq("id", membershipId)
    .maybeSingle();

  if (fetchError || !membership) {
    return { success: false, error: "Adhésion introuvable." };
  }

  if (membership.status === MEMBERSHIP_STATUS.suspended) {
    return { success: false, error: "Cette adhésion est déjà suspendue." };
  }

  const { error } = await supabase
    .from("memberships")
    .update({
      status: MEMBERSHIP_STATUS.suspended,
      suspended_at: new Date().toISOString(),
      suspension_reason: trimmedReason,
    })
    .eq("id", membershipId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(ROUTES.backoffice.communeDetail(membership.commune_id));
  revalidatePath(ROUTES.backoffice.userDetail(membership.user_id));
  revalidatePath(ROUTES.backoffice.communes);

  return { success: true };
}

export async function suspendUserFromAllCommunesAction(
  userId: string,
  reason: string,
): Promise<ModerationActionResult> {
  await requirePlatformAdmin();

  const trimmedReason = reason.trim();
  if (!userId || !trimmedReason) {
    return { success: false, error: "Paramètres invalides." };
  }

  const supabase = await createClient();
  const { data: memberships, error: fetchError } = await supabase
    .from("memberships")
    .select("id, commune_id")
    .eq("user_id", userId)
    .eq("status", MEMBERSHIP_STATUS.active);

  if (fetchError) {
    return { success: false, error: fetchError.message };
  }

  if (!memberships?.length) {
    return { success: false, error: "Aucune adhésion active à suspendre." };
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("memberships")
    .update({
      status: MEMBERSHIP_STATUS.suspended,
      suspended_at: now,
      suspension_reason: trimmedReason,
    })
    .eq("user_id", userId)
    .eq("status", MEMBERSHIP_STATUS.active);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(ROUTES.backoffice.userDetail(userId));
  revalidatePath(ROUTES.backoffice.communes);

  for (const membership of memberships) {
    revalidatePath(ROUTES.backoffice.communeDetail(membership.commune_id));
  }

  return { success: true };
}
