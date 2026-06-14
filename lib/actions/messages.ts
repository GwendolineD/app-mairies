"use server";

import { revalidatePath } from "next/cache";
import { requireActiveMembership } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";
import { messageSchema } from "@/lib/validations/schemas";
import {
  notifyUser,
  shouldNotifyMessage,
} from "@/lib/services/push-notifications";
import type { ConversationContextType } from "@/lib/types";

function normalizePair(userIdA: string, userIdB: string): [string, string] {
  return userIdA < userIdB ? [userIdA, userIdB] : [userIdB, userIdA];
}

type EnsureResult = {
  conversationId: string | null;
  error: string | null;
};

type ContextRow = {
  id: string;
  commune_id: string;
  title: string;
  author_membership_id: string;
};

const CONTEXT_TABLES: Record<ConversationContextType, string> = {
  announcement: "announcements",
  initiative: "initiatives",
  event: "events",
};

/**
 * Generic helper: ensure a 1:1 conversation exists between the current user and
 * the author of a given context (announcement | initiative | event), scoped to
 * the active commune. Idempotent thanks to the partial unique index
 * (commune_id, context_type, context_id, participant_a, participant_b).
 */
async function ensureConversation(
  contextType: ConversationContextType,
  contextId: string,
): Promise<EnsureResult> {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();
  const communeId = ctx.activeMembership!.commune_id;
  const table = CONTEXT_TABLES[contextType];

  const { data: row, error: ctxError } = await supabase
    .from(table)
    .select("id, commune_id, title, author_membership_id")
    .eq("id", contextId)
    .eq("commune_id", communeId)
    .single();

  if (ctxError || !row) {
    return { error: "Élément introuvable", conversationId: null };
  }
  const context = row as ContextRow;

  const { data: authorMembership } = await supabase
    .from("memberships")
    .select("user_id")
    .eq("id", context.author_membership_id)
    .single();

  const authorUserId = authorMembership?.user_id;
  if (!authorUserId) {
    return { error: "Auteur introuvable", conversationId: null };
  }
  if (authorUserId === ctx.userId) {
    return {
      error: "Vous ne pouvez pas vous contacter vous-même",
      conversationId: null,
    };
  }

  const [participantA, participantB] = normalizePair(ctx.userId, authorUserId);

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("commune_id", communeId)
    .eq("context_type", contextType)
    .eq("context_id", contextId)
    .eq("participant_a", participantA)
    .eq("participant_b", participantB)
    .maybeSingle();

  if (existing) {
    // Restore from archive if the requester had soft-deleted this conversation
    await supabase
      .from("conversation_participants")
      .update({ archived_at: null })
      .eq("conversation_id", existing.id)
      .eq("user_id", ctx.userId);
    return { conversationId: existing.id, error: null };
  }

  const { data: conv, error } = await supabase
    .from("conversations")
    .insert({
      commune_id: communeId,
      created_by_user_id: ctx.userId,
      context_type: contextType,
      context_id: contextId,
      title: context.title,
      participant_a: participantA,
      participant_b: participantB,
    })
    .select("id")
    .single();

  if (error || !conv) {
    return { error: error?.message ?? "Erreur", conversationId: null };
  }

  await supabase.from("conversation_participants").insert([
    { conversation_id: conv.id, user_id: participantA },
    { conversation_id: conv.id, user_id: participantB },
  ]);

  revalidatePath(ROUTES.messages.list);
  return { conversationId: conv.id, error: null };
}

export async function ensureAnnouncementConversation(announcementId: string) {
  return ensureConversation("announcement", announcementId);
}

export async function ensureInitiativeConversation(initiativeId: string) {
  return ensureConversation("initiative", initiativeId);
}

export async function ensureEventConversation(eventId: string) {
  return ensureConversation("event", eventId);
}

export async function sendConversationMessage(formData: FormData) {
  const ctx = await requireActiveMembership();
  const conversationId = formData.get("conversationId") as string;
  const body = formData.get("body") as string;

  const parsed = messageSchema.safeParse({ body });
  if (!parsed.success) return { error: "Message invalide" };

  const supabase = await createClient();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, context_type, title, participant_a, participant_b")
    .eq("id", conversationId)
    .maybeSingle();

  if (!conversation) return { error: "Conversation inaccessible" };

  const recipientUserId =
    conversation.participant_a === ctx.userId
      ? conversation.participant_b
      : conversation.participant_a;

  if (!recipientUserId) return { error: "Conversation invalide" };

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: ctx.userId,
    body: parsed.data.body,
  });
  if (error) return { error: error.message };

  // Mark sender's last_read_at — their own message counts as read.
  await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString(), archived_at: null })
    .eq("conversation_id", conversationId)
    .eq("user_id", ctx.userId);

  // Notify recipient if their preferences allow.
  const allowed = await shouldNotifyMessage(
    supabase,
    recipientUserId,
    conversation.context_type as ConversationContextType | null,
  );
  if (allowed) {
    const senderName = ctx.profile.display_name ?? "Un·e voisin·e";
    const preview = parsed.data.body.slice(0, 140);
    await notifyUser(recipientUserId, {
      title: `Nouveau message — ${senderName}`,
      body: conversation.title
        ? `${conversation.title} · ${preview}`
        : preview,
      url: ROUTES.messages.detail(conversationId),
      tag: `conv:${conversationId}`,
      payloadJson: {
        conversation_id: conversationId,
        context_type: conversation.context_type,
      },
    });
  }

  revalidatePath(ROUTES.messages.list);
  revalidatePath(ROUTES.messages.detail(conversationId));
  return { success: true };
}

/** Mark a conversation as read for the current user (touches last_read_at). */
export async function markConversationRead(conversationId: string) {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();
  await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", ctx.userId);
  revalidatePath(ROUTES.messages.list);
  return { success: true };
}

/** Soft-delete: archive the conversation for the current user only (30-day trash). */
export async function archiveConversation(conversationId: string) {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();
  const { error } = await supabase
    .from("conversation_participants")
    .update({ archived_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", ctx.userId);
  if (error) return { error: error.message };
  revalidatePath(ROUTES.messages.list);
  revalidatePath(ROUTES.messages.detail(conversationId));
  return { success: true };
}

/** Restore an archived conversation from the trash for the current user. */
export async function restoreConversation(conversationId: string) {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();
  const { error } = await supabase
    .from("conversation_participants")
    .update({ archived_at: null })
    .eq("conversation_id", conversationId)
    .eq("user_id", ctx.userId);
  if (error) return { error: error.message };
  revalidatePath(ROUTES.messages.list);
  revalidatePath(ROUTES.messages.detail(conversationId));
  return { success: true };
}

export async function createNeighborInvite(formData: FormData): Promise<void> {
  const ctx = await requireActiveMembership();

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  if (!email || !email.includes("@")) return;

  const supabase = await createClient();
  const randomPart = [...crypto.getRandomValues(new Uint8Array(16))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const { error } = await supabase.from("neighbor_invites").insert({
    inviter_membership_id: ctx.activeMembership!.id,
    commune_id: ctx.activeMembership!.commune_id,
    email,
    token: `${randomPart}`,
    expires_at: null,
  });

  if (error) return;
  revalidatePath(ROUTES.profil);
}
