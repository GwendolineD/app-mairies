"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAudit } from "@/lib/audit/log";
import { ANNOUNCEMENT_STATUS } from "@/lib/constants/statuses";
import { ROUTES } from "@/lib/constants/routes";
import { cancelPendingEmails } from "@/lib/cron/cancel-pending-emails";
import { requireAuth } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

/**
 * Leave a commune: deletes all user content in the commune, archives
 * conversations, sets membership to 'left', and reassigns active commune.
 *
 * ORDERING IS INTENTIONAL — content deletion and conversation archiving
 * must happen BEFORE setting status to 'left', because RLS policies
 * (owns_active_membership, can_access_commune_content) require the
 * membership to still be 'active'.
 */
export async function leaveCommune(
  communeId: string,
): Promise<{ success: true } | { error: string }> {
  const ctx = await requireAuth();
  const supabase = await createClient();

  // --- 1. Load target membership ---
  const membership = ctx.memberships.find(
    (m) => m.commune_id === communeId && m.status === "active",
  );

  if (!membership) {
    return { error: "Aucune adhésion active trouvée pour cette commune." };
  }

  const membershipId = membership.id;
  const userId = ctx.userId;

  // --- 2. Delete all authored content (while membership is still active) ---
  try {
    await deleteAuthoredContent(supabase, membershipId, communeId);
  } catch (err) {
    console.error("[leaveCommune] content deletion failed:", err);
    return { error: "Erreur lors de la suppression de vos contenus. Veuillez réessayer." };
  }

  // --- 3. Archive conversations in this commune ---
  try {
    await archiveCommuneConversations(supabase, userId, communeId);
  } catch (err) {
    console.error("[leaveCommune] conversation archiving failed:", err);
    // Non-blocking: proceed with membership update
  }

  // --- 4. Set membership to 'left' ---
  const { error: updateError } = await supabase
    .from("memberships")
    .update({ status: "left" as const })
    .eq("id", membershipId);

  if (updateError) {
    console.error("[leaveCommune] membership update failed:", updateError);
    return { error: "Erreur lors du départ. Veuillez réessayer." };
  }

  // --- 5. Reassign active_commune_id if this was the active commune ---
  if (ctx.activeCommuneId === communeId) {
    const { data: fallback } = await supabase
      .from("memberships")
      .select("commune_id")
      .eq("user_id", userId)
      .eq("status", "active")
      .neq("commune_id", communeId)
      .limit(1)
      .maybeSingle();

    await supabase
      .from("profiles")
      .update({ active_commune_id: fallback?.commune_id ?? null })
      .eq("user_id", userId);
  }

  // --- 6. Audit log ---
  void logAudit({
    action: "membership.leave",
    category: "auth",
    userId,
    communeId,
    targetType: "membership",
    targetId: membershipId,
    metadata: {
      commune_name: membership.commune?.name ?? null,
      role: membership.role,
    },
  });

  revalidatePath("/", "layout");

  // Redirect based on whether the user has remaining active communes
  if (ctx.activeCommuneId === communeId) {
    const hasOtherActive = ctx.memberships.some(
      (m) => m.commune_id !== communeId && m.status === "active",
    );
    if (hasOtherActive) {
      redirect(ROUTES.accueil);
    } else {
      redirect(ROUTES.inscription.commune);
    }
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function deleteAuthoredContent(
  supabase: SupabaseClient,
  membershipId: string,
  communeId: string,
): Promise<void> {
  // -- Announcements: soft-delete + content_outcomes --
  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, type, category_slug")
    .eq("author_membership_id", membershipId);

  if (announcements?.length) {
    await supabase.from("content_outcomes").insert(
      announcements.map((a) => ({
        content_kind: "announcement" as const,
        content_type: a.type,
        category_slug: a.category_slug,
        outcome: "unfulfilled" as const,
        commune_id: communeId,
        membership_id: membershipId,
      })),
    );

    await supabase
      .from("announcements")
      .update({
        status: ANNOUNCEMENT_STATUS.archivee,
        archived_at: new Date().toISOString(),
      })
      .eq("author_membership_id", membershipId);

    for (const a of announcements) {
      void cancelPendingEmails("announcement", a.id);
    }
  }

  // -- Events: hard-delete + content_outcomes (CASCADE on volunteers/participants) --
  const { data: events } = await supabase
    .from("events")
    .select("id, category_slug")
    .eq("author_membership_id", membershipId);

  if (events?.length) {
    await supabase.from("content_outcomes").insert(
      events.map((e) => ({
        content_kind: "event" as const,
        content_type: null,
        category_slug: e.category_slug ?? "autre",
        outcome: "unfulfilled" as const,
        commune_id: communeId,
        membership_id: membershipId,
      })),
    );

    await supabase
      .from("events")
      .delete()
      .eq("author_membership_id", membershipId);

    for (const e of events) {
      void cancelPendingEmails("event", e.id);
    }
  }

  // -- Initiatives: hard-delete (CASCADE on initiative_responses) --
  const { data: initiatives } = await supabase
    .from("initiatives")
    .select("id")
    .eq("author_membership_id", membershipId);

  if (initiatives?.length) {
    await supabase
      .from("initiatives")
      .delete()
      .eq("author_membership_id", membershipId);

    for (const i of initiatives) {
      void cancelPendingEmails("initiative", i.id);
    }
  }
}

async function archiveCommuneConversations(
  supabase: SupabaseClient,
  userId: string,
  communeId: string,
): Promise<void> {
  // Get conversation IDs for this commune where the user is a participant
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id")
    .eq("commune_id", communeId)
    .or(`participant_a.eq.${userId},participant_b.eq.${userId}`);

  if (!conversations?.length) return;

  const conversationIds = conversations.map((c) => c.id);

  await supabase
    .from("conversation_participants")
    .update({ archived_at: new Date().toISOString() })
    .eq("user_id", userId)
    .in("conversation_id", conversationIds);
}
