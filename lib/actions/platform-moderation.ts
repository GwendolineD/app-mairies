"use server";

import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit/log";
import { reassignActiveCommuneAfterSuspension } from "@/lib/auth/reassign-active-commune";
import { requirePlatformAdmin } from "@/lib/auth/session";
import {
  markReportsRestoredForUser,
  resolvePendingReportsForUser,
} from "@/lib/services/report-resolution";
import { logModerationReactivate } from "@/lib/services/moderation-log";
import { ROUTES } from "@/lib/constants/routes";
import { MEMBERSHIP_STATUS } from "@/lib/constants/statuses";
import { validateSuspensionReason } from "@/lib/constants/moderation";
import {
  notifyUserRestored,
  notifyUserSuspended,
} from "@/lib/email/suspension-notification";
import { createClient } from "@/lib/supabase/server";

export type ModerationActionResult =
  | { success: true }
  | { success: false; error: string };

export async function suspendMembershipAction(
  membershipId: string,
  reason: string,
): Promise<ModerationActionResult> {
  const { userId: actorUserId } = await requirePlatformAdmin();

  const trimmedReason = reason.trim();
  if (!membershipId) {
    return { success: false, error: "Paramètres invalides." };
  }

  const reasonError = validateSuspensionReason(reason);
  if (reasonError) {
    return { success: false, error: reasonError };
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

  await reassignActiveCommuneAfterSuspension(
    supabase,
    membership.user_id,
    membership.commune_id,
  );

  void logAudit({
    action: "moderation.suspend_membership_admin",
    category: "moderation",
    severity: "warning",
    userId: actorUserId,
    targetType: "membership",
    targetId: membershipId,
    communeId: membership.commune_id,
    metadata: { reason: trimmedReason },
  });

  notifyUserSuspended({
    userId: membership.user_id,
    reason: trimmedReason,
    scope: "single",
    communeId: membership.commune_id,
  }).catch((err) =>
    console.error(
      "[platform-moderation] Failed to send user suspension email:",
      err,
    ),
  );

  revalidatePath(ROUTES.backoffice.communeDetail(membership.commune_id));
  revalidatePath(ROUTES.backoffice.userDetail(membership.user_id));
  revalidatePath(ROUTES.backoffice.communes);

  return { success: true };
}

export async function suspendUserFromAllCommunesAction(
  userId: string,
  reason: string,
): Promise<ModerationActionResult> {
  const { userId: actorUserId } = await requirePlatformAdmin();

  const trimmedReason = reason.trim();
  if (!userId) {
    return { success: false, error: "Paramètres invalides." };
  }

  const reasonError = validateSuspensionReason(reason);
  if (reasonError) {
    return { success: false, error: reasonError };
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

  // All active memberships are now suspended: no fallback commune remains,
  // so the user lands on /suspendu on next navigation.
  await supabase
    .from("profiles")
    .update({ active_commune_id: null })
    .eq("user_id", userId);

  for (const membership of memberships) {
    await resolvePendingReportsForUser(
      membership.id,
      userId,
      membership.commune_id,
      actorUserId,
    );
  }

  revalidatePath(ROUTES.backoffice.userDetail(userId));
  revalidatePath(ROUTES.backoffice.communes);
  revalidatePath(ROUTES.backoffice.signalements);
  revalidatePath("/backoffice", "layout");
  revalidatePath(ROUTES.mairie.signalements);

  for (const membership of memberships) {
    revalidatePath(ROUTES.backoffice.communeDetail(membership.commune_id));
  }

  void logAudit({
    action: "moderation.suspend_all_communes",
    category: "moderation",
    severity: "warning",
    userId: actorUserId,
    targetType: "user",
    targetId: userId,
    metadata: {
      reason: trimmedReason,
      membership_count: memberships.length,
    },
  });

  notifyUserSuspended({
    userId,
    reason: trimmedReason,
    scope: "all",
    communeIds: memberships.map((m) => m.commune_id),
  }).catch((err) =>
    console.error(
      "[platform-moderation] Failed to send multi-commune suspension email:",
      err,
    ),
  );

  return { success: true };
}

export async function reactivateMembershipAction(
  membershipId: string,
): Promise<ModerationActionResult> {
  const { userId: actorUserId } = await requirePlatformAdmin();

  if (!membershipId) {
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

  if (membership.status !== MEMBERSHIP_STATUS.suspended) {
    return { success: false, error: "Cette adhésion n'est pas suspendue." };
  }

  const { error } = await supabase
    .from("memberships")
    .update({
      status: MEMBERSHIP_STATUS.active,
      suspended_at: null,
      suspension_reason: null,
    })
    .eq("id", membershipId);

  if (error) {
    return { success: false, error: error.message };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("active_commune_id")
    .eq("user_id", membership.user_id)
    .single();

  if (!profile?.active_commune_id) {
    await supabase
      .from("profiles")
      .update({ active_commune_id: membership.commune_id })
      .eq("user_id", membership.user_id);
  }

  const restoredAt = new Date().toISOString();
  await markReportsRestoredForUser(
    membershipId,
    membership.user_id,
    membership.commune_id,
    restoredAt,
    actorUserId,
  );

  await logModerationReactivate(supabase, {
    actorUserId,
    targetType: "membership",
    targetId: membershipId,
    communeId: membership.commune_id,
  });

  void logAudit({
    action: "moderation.reactivate_membership_admin",
    category: "moderation",
    severity: "warning",
    userId: actorUserId,
    targetType: "membership",
    targetId: membershipId,
    communeId: membership.commune_id,
  });

  notifyUserRestored({
    userId: membership.user_id,
    context: "membership",
    communeId: membership.commune_id,
  }).catch((err) =>
    console.error(
      "[platform-moderation] Failed to send membership restoration email:",
      err,
    ),
  );

  revalidatePath(ROUTES.backoffice.userDetail(membership.user_id));
  revalidatePath(ROUTES.backoffice.communeDetail(membership.commune_id));
  revalidatePath(ROUTES.backoffice.communes);
  revalidatePath(ROUTES.backoffice.signalements);
  revalidatePath("/backoffice", "layout");
  revalidatePath(ROUTES.mairie.signalements);

  return { success: true };
}

export async function restoreUserFromAllCommunesAction(
  userId: string,
): Promise<ModerationActionResult> {
  const { userId: actorUserId } = await requirePlatformAdmin();

  if (!userId) {
    return { success: false, error: "Paramètres invalides." };
  }

  const supabase = await createClient();
  const { data: memberships, error: fetchError } = await supabase
    .from("memberships")
    .select("id, commune_id")
    .eq("user_id", userId)
    .eq("status", MEMBERSHIP_STATUS.suspended);

  if (fetchError) {
    return { success: false, error: fetchError.message };
  }

  if (!memberships?.length) {
    return { success: false, error: "Aucune adhésion suspendue à restaurer." };
  }

  const { error } = await supabase
    .from("memberships")
    .update({
      status: MEMBERSHIP_STATUS.active,
      suspended_at: null,
      suspension_reason: null,
    })
    .eq("user_id", userId)
    .eq("status", MEMBERSHIP_STATUS.suspended);

  if (error) {
    return { success: false, error: error.message };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("active_commune_id")
    .eq("user_id", userId)
    .single();

  if (!profile?.active_commune_id) {
    await supabase
      .from("profiles")
      .update({ active_commune_id: memberships[0]!.commune_id })
      .eq("user_id", userId);
  }

  const restoredAt = new Date().toISOString();
  for (const membership of memberships) {
    await markReportsRestoredForUser(
      membership.id,
      userId,
      membership.commune_id,
      restoredAt,
      actorUserId,
    );
    await logModerationReactivate(supabase, {
      actorUserId,
      targetType: "membership",
      targetId: membership.id,
      communeId: membership.commune_id,
    });
  }

  revalidatePath(ROUTES.backoffice.userDetail(userId));
  revalidatePath(ROUTES.backoffice.communes);
  revalidatePath(ROUTES.backoffice.signalements);
  revalidatePath("/backoffice", "layout");
  revalidatePath(ROUTES.mairie.signalements);

  for (const membership of memberships) {
    revalidatePath(ROUTES.backoffice.communeDetail(membership.commune_id));
  }

  void logAudit({
    action: "moderation.restore_all_communes",
    category: "moderation",
    severity: "warning",
    userId: actorUserId,
    targetType: "user",
    targetId: userId,
    metadata: {
      membership_count: memberships.length,
    },
  });

  notifyUserRestored({
    userId,
    context: "all",
    communeIds: memberships.map((m) => m.commune_id),
  }).catch((err) =>
    console.error(
      "[platform-moderation] Failed to send multi-commune restoration email:",
      err,
    ),
  );

  return { success: true };
}
