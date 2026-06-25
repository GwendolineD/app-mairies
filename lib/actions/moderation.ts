"use server";

import { revalidatePath } from "next/cache";
import {
  requireCommuneStaff,
  requirePlatformAdmin,
} from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import {
  markReportsRestoredForContent,
  markReportsRestoredForUser,
  resolvePendingReportsForContent,
  resolvePendingReportsForUser,
} from "@/lib/actions/municipality";
import { MEMBERSHIP_STATUS } from "@/lib/constants/statuses";
import { formatDisplayName } from "@/lib/utils/display-name";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { ConversationContextType } from "@/lib/types";

export type ModerationActionResult =
  | { success: true; restoredAt?: string; actorName?: string }
  | { success: false; error: string };

const CONTENT_TARGET_TYPES = new Set([
  "announcement",
  "initiative",
  "event",
]);

async function resolveModerationActorName(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<string> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, display_name")
    .eq("user_id", userId)
    .maybeSingle();

  if (profile?.first_name && profile?.last_name) {
    return formatDisplayName(profile.first_name, profile.last_name);
  }

  return profile?.display_name?.trim() || "Modérateur";
}

async function logModerationReactivate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  entry: {
    actorUserId: string;
    targetType: string;
    targetId: string;
    communeId: string;
  },
): Promise<boolean> {
  const { error } = await supabase.from("moderation_actions").insert({
    actor_user_id: entry.actorUserId,
    target_type: entry.targetType as "announcement" | "initiative" | "event" | "membership",
    target_id: entry.targetId,
    commune_id: entry.communeId,
    action: "reactivate",
    reason: null,
  });

  if (error) {
    console.error(
      "[moderation] Failed to log reactivate action:",
      error.message,
      error.code,
    );
    return false;
  }

  return true;
}

type ContentType = ConversationContextType;

const TABLE_MAP = {
  announcement: "announcements",
  initiative: "initiatives",
  event: "events",
} as const satisfies Record<ContentType, "announcements" | "initiatives" | "events">;

function revalidateContentPaths(type: ContentType, id: string, communeId: string) {
  revalidatePath(ROUTES.accueil);
  if (type === "announcement") {
    revalidatePath(ROUTES.annonces.list);
    revalidatePath(ROUTES.annonces.map);
    revalidatePath(ROUTES.annonces.detail(id));
  } else if (type === "initiative") {
    revalidatePath(ROUTES.initiatives.list);
    revalidatePath(ROUTES.initiatives.detail(id));
  } else if (type === "event") {
    revalidatePath(ROUTES.evenements.list);
    revalidatePath(ROUTES.evenements.detail(id));
  }
  revalidatePath(ROUTES.mairie.signalements);
  revalidatePath(ROUTES.backoffice.signalements);
  revalidatePath(ROUTES.backoffice.communeDetail(communeId));
}

export async function suspendContent(
  type: ContentType,
  contentId: string,
  reason: string,
  relatedReportId?: string,
): Promise<ModerationActionResult> {
  const trimmedReason = reason.trim();
  if (!contentId || !trimmedReason) {
    return { success: false, error: "Paramètres invalides." };
  }

  const table = TABLE_MAP[type];
  if (!table) return { success: false, error: "Type de contenu invalide." };

  const supabase = await createClient();

  const { data: content, error: fetchError } = await supabase
    .from(table as "announcements")
    .select("id, commune_id, suspended_at")
    .eq("id", contentId)
    .maybeSingle();

  if (fetchError || !content) {
    return { success: false, error: "Contenu introuvable." };
  }

  let actorUserId: string;

  try {
    const ctx = await requireCommuneStaff();
    if (ctx.communeId !== content.commune_id) {
      const adminCtx = await requirePlatformAdmin();
      actorUserId = adminCtx.userId;
    } else {
      actorUserId = ctx.userId;
    }
  } catch {
    const adminCtx = await requirePlatformAdmin();
    actorUserId = adminCtx.userId;
  }

  if (content.suspended_at) {
    await resolvePendingReportsForContent(
      type,
      contentId,
      content.commune_id,
      "content_suspended",
      actorUserId,
    );
    revalidateContentPaths(type, contentId, content.commune_id);
    return { success: true };
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from(table as "announcements")
    .update({
      suspended_at: now,
      suspended_by: actorUserId,
      suspension_reason: trimmedReason,
    })
    .eq("id", contentId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Log the moderation action
  await supabase.from("moderation_actions").insert({
    actor_user_id: actorUserId,
    target_type: type,
    target_id: contentId,
    commune_id: content.commune_id,
    action: "suspend",
    reason: trimmedReason,
    related_report_id: relatedReportId || null,
  });

  await resolvePendingReportsForContent(
    type,
    contentId,
    content.commune_id,
    "content_suspended",
    actorUserId,
  );

  revalidateContentPaths(type, contentId, content.commune_id);
  return { success: true };
}

export async function reactivateContent(
  type: ContentType,
  contentId: string,
): Promise<ModerationActionResult> {
  if (!contentId) {
    return { success: false, error: "Paramètres invalides." };
  }

  const table = TABLE_MAP[type];
  if (!table) return { success: false, error: "Type de contenu invalide." };

  const supabase = await createClient();

  const { data: content, error: fetchError } = await supabase
    .from(table as "announcements")
    .select("id, commune_id, suspended_at")
    .eq("id", contentId)
    .maybeSingle();

  if (fetchError || !content) {
    return { success: false, error: "Contenu introuvable." };
  }

  if (!content.suspended_at) {
    return { success: false, error: "Ce contenu n'est pas suspendu." };
  }

  let actorUserId: string;
  try {
    const ctx = await requireCommuneStaff();
    if (ctx.communeId !== content.commune_id) {
      const adminCtx = await requirePlatformAdmin();
      actorUserId = adminCtx.userId;
    } else {
      actorUserId = ctx.userId;
    }
  } catch {
    const adminCtx = await requirePlatformAdmin();
    actorUserId = adminCtx.userId;
  }

  const { error: updateError } = await supabase
    .from(table as "announcements")
    .update({
      suspended_at: null,
      suspended_by: null,
      suspension_reason: null,
    })
    .eq("id", contentId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  const restoredAt = new Date().toISOString();
  await logModerationReactivate(supabase, {
    actorUserId,
    targetType: type,
    targetId: contentId,
    communeId: content.commune_id,
  });
  const actorName = await resolveModerationActorName(supabase, actorUserId);
  await markReportsRestoredForContent(
    type,
    contentId,
    restoredAt,
    actorUserId,
  );

  revalidateContentPaths(type, contentId, content.commune_id);
  return { success: true, restoredAt, actorName };
}

export async function suspendMembershipByStaff(
  membershipId: string,
  reason: string,
): Promise<ModerationActionResult> {
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

  if (membership.status !== MEMBERSHIP_STATUS.active) {
    return { success: false, error: "Seule une adhésion active peut être suspendue." };
  }

  let actorUserId: string;

  try {
    const ctx = await requireCommuneStaff();
    if (membership.commune_id !== ctx.communeId) {
      const adminCtx = await requirePlatformAdmin();
      actorUserId = adminCtx.userId;
    } else {
      actorUserId = ctx.userId;
    }
  } catch {
    const adminCtx = await requirePlatformAdmin();
    actorUserId = adminCtx.userId;
  }

  if (membership.user_id === actorUserId) {
    return { success: false, error: "Vous ne pouvez pas suspendre votre propre compte." };
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("memberships")
    .update({
      status: MEMBERSHIP_STATUS.suspended,
      suspended_at: now,
      suspension_reason: trimmedReason,
    })
    .eq("id", membershipId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  await supabase.from("moderation_actions").insert({
    actor_user_id: actorUserId,
    target_type: "membership",
    target_id: membershipId,
    commune_id: membership.commune_id,
    action: "suspend",
    reason: trimmedReason,
  });

  await resolvePendingReportsForUser(
    membershipId,
    membership.user_id,
    membership.commune_id,
    actorUserId,
  );

  revalidatePath(ROUTES.mairie.habitants);
  revalidatePath(ROUTES.mairie.signalements);
  revalidatePath(ROUTES.backoffice.signalements);
  revalidatePath(ROUTES.backoffice.userDetail(membership.user_id));
  revalidatePath(ROUTES.backoffice.communeDetail(membership.commune_id));

  return { success: true };
}

export async function reactivateMembership(
  membershipId: string,
): Promise<ModerationActionResult> {
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

  let actorUserId: string;
  try {
    const ctx = await requireCommuneStaff();
    if (ctx.communeId !== membership.commune_id) {
      const adminCtx = await requirePlatformAdmin();
      actorUserId = adminCtx.userId;
    } else {
      actorUserId = ctx.userId;
    }
  } catch {
    const adminCtx = await requirePlatformAdmin();
    actorUserId = adminCtx.userId;
  }

  const { error: updateError } = await supabase
    .from("memberships")
    .update({
      status: MEMBERSHIP_STATUS.active,
      suspended_at: null,
      suspension_reason: null,
    })
    .eq("id", membershipId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  const restoredAt = new Date().toISOString();
  await logModerationReactivate(supabase, {
    actorUserId,
    targetType: "membership",
    targetId: membershipId,
    communeId: membership.commune_id,
  });
  const actorName = await resolveModerationActorName(supabase, actorUserId);
  await markReportsRestoredForUser(
    membershipId,
    membership.user_id,
    membership.commune_id,
    restoredAt,
    actorUserId,
  );

  revalidatePath(ROUTES.mairie.habitants);
  revalidatePath(ROUTES.mairie.signalements);
  revalidatePath(ROUTES.backoffice.signalements);
  revalidatePath(ROUTES.backoffice.userDetail(membership.user_id));
  revalidatePath(ROUTES.backoffice.communeDetail(membership.commune_id));

  return { success: true, restoredAt, actorName };
}

export async function banUserFromPlatform(
  userId: string,
  reason: string,
): Promise<ModerationActionResult> {
  const ctx = await requirePlatformAdmin();
  const trimmedReason = reason.trim();

  if (!userId || !trimmedReason) {
    return { success: false, error: "Paramètres invalides." };
  }

  const supabase = await createClient();
  const serviceClient = await createServiceClient();

  // Get user email for banned_emails table
  const { data: authData } = await serviceClient.auth.admin.getUserById(userId);
  if (!authData?.user?.email) {
    return { success: false, error: "Utilisateur introuvable." };
  }

  const now = new Date().toISOString();

  // 1. Ban profile
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      banned_at: now,
      ban_reason: trimmedReason,
      banned_by: ctx.userId,
    })
    .eq("user_id", userId);

  if (profileError) {
    return { success: false, error: profileError.message };
  }

  // 2. Add email to banned_emails
  await supabase.from("banned_emails").upsert({
    email: authData.user.email,
    reason: trimmedReason,
    banned_by: ctx.userId,
    banned_at: now,
  });

  // 3. Suspend all active memberships
  const { data: memberships } = await supabase
    .from("memberships")
    .select("id, commune_id")
    .eq("user_id", userId)
    .eq("status", MEMBERSHIP_STATUS.active);

  if (memberships?.length) {
    await supabase
      .from("memberships")
      .update({
        status: MEMBERSHIP_STATUS.suspended,
        suspended_at: now,
        suspension_reason: trimmedReason,
      })
      .eq("user_id", userId)
      .eq("status", MEMBERSHIP_STATUS.active);
  }

  // 4. Force sign out
  await serviceClient.auth.admin.signOut(userId);

  // 5. Log moderation action
  await supabase.from("moderation_actions").insert({
    actor_user_id: ctx.userId,
    target_type: "user",
    target_id: userId,
    commune_id: null,
    action: "ban",
    reason: trimmedReason,
  });

  revalidatePath(ROUTES.backoffice.userDetail(userId));
  revalidatePath(ROUTES.backoffice.communes);

  return { success: true };
}

export async function unbanUserFromPlatform(
  userId: string,
): Promise<ModerationActionResult> {
  const ctx = await requirePlatformAdmin();

  if (!userId) {
    return { success: false, error: "Paramètres invalides." };
  }

  const supabase = await createClient();
  const serviceClient = await createServiceClient();

  // Get user email to remove from banned list
  const { data: authData } = await serviceClient.auth.admin.getUserById(userId);

  // 1. Clear profile ban
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      banned_at: null,
      ban_reason: null,
      banned_by: null,
    })
    .eq("user_id", userId);

  if (profileError) {
    return { success: false, error: profileError.message };
  }

  // 2. Remove from banned_emails
  if (authData?.user?.email) {
    await supabase
      .from("banned_emails")
      .delete()
      .eq("email", authData.user.email);
  }

  // 3. Reactivate all suspended memberships
  await supabase
    .from("memberships")
    .update({
      status: MEMBERSHIP_STATUS.active,
      suspended_at: null,
      suspension_reason: null,
    })
    .eq("user_id", userId)
    .eq("status", MEMBERSHIP_STATUS.suspended);

  // 4. Log moderation action
  await supabase.from("moderation_actions").insert({
    actor_user_id: ctx.userId,
    target_type: "user",
    target_id: userId,
    commune_id: null,
    action: "unban",
    reason: null,
  });

  revalidatePath(ROUTES.backoffice.userDetail(userId));
  revalidatePath(ROUTES.backoffice.communes);

  return { success: true };
}
