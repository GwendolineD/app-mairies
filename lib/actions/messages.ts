"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, requireActiveMembership } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendPushToUsers } from "@/lib/push/send";
import { messageSchema } from "@/lib/validations/schemas";
import type { ContextType } from "@/lib/types";

type ActionResult<T> = ({ ok: true } & T) | { ok: false; error: string };

function mapConversationError(message?: string | null): string {
  const text = message ?? "";
  if (text.includes("CANNOT_CONTACT_SELF")) {
    return "Vous êtes l'auteur·e de ce contenu : pas besoin de vous écrire.";
  }
  if (text.includes("CONTENT_NOT_FOUND")) {
    return "Ce contenu n'existe plus.";
  }
  if (text.includes("NOT_AUTHORIZED")) {
    return "Vous n'avez pas accès à cette commune.";
  }
  return "Impossible d'ouvrir la conversation pour le moment.";
}

/**
 * Idempotently resolve the 1:1 thread for a given content item and the current
 * user. One conversation per neighbour AND per announcement/initiative/event.
 */
export async function ensureContextConversation(
  contextType: ContextType,
  contextId: string,
): Promise<ActionResult<{ conversationId: string }>> {
  await requireActiveMembership();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc(
    "get_or_create_context_conversation",
    { p_context_type: contextType, p_context_id: contextId },
  );

  if (error || !data) {
    return { ok: false, error: mapConversationError(error?.message) };
  }

  revalidatePath(ROUTES.messages);
  return { ok: true, conversationId: data as string };
}

async function notifyRecipients(
  conversationId: string,
  senderId: string,
  body: string,
): Promise<void> {
  const service = await createServiceClient();

  const { data: participants } = await service
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .neq("user_id", senderId);

  const recipientIds = (participants ?? []).map((p) => p.user_id as string);
  if (recipientIds.length === 0) return;

  const { data: sender } = await service
    .from("profiles")
    .select("display_name, first_name, last_name")
    .eq("user_id", senderId)
    .single();

  const senderName =
    sender?.display_name ||
    [sender?.first_name, sender?.last_name].filter(Boolean).join(" ").trim() ||
    "Un·e voisin·e";

  await sendPushToUsers(recipientIds, {
    title: senderName,
    body: body.slice(0, 140),
    url: ROUTES.messageThread(conversationId),
    tag: `conv-${conversationId}`,
  });
}

export async function sendConversationMessage(
  conversationId: string,
  body: string,
): Promise<ActionResult<{ messageId: string }>> {
  const ctx = await requireActiveMembership();

  const parsed = messageSchema.safeParse({ body });
  if (!parsed.success) {
    return { ok: false, error: "Message vide ou trop long (5000 caractères max)." };
  }

  const supabase = await createClient();
  const { data: inserted, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: ctx.userId,
      body: parsed.data.body,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { ok: false, error: "Envoi impossible. Réessayez." };
  }

  // The author of a message has implicitly read everything up to now.
  await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", ctx.userId);

  await notifyRecipients(conversationId, ctx.userId, parsed.data.body);

  revalidatePath(ROUTES.messageThread(conversationId));
  revalidatePath(ROUTES.messages);
  return { ok: true, messageId: inserted.id as string };
}

export async function markConversationRead(conversationId: string): Promise<void> {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();

  await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", ctx.userId);

  revalidatePath(ROUTES.messages);
}

export async function savePushSubscription(input: {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
}): Promise<{ ok: boolean }> {
  const ctx = await requireAuth();
  const supabase = await createClient();

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: ctx.userId,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
      user_agent: input.userAgent ?? null,
    },
    { onConflict: "endpoint" },
  );

  return { ok: !error };
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  const ctx = await requireAuth();
  const supabase = await createClient();
  await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", ctx.userId)
    .eq("endpoint", endpoint);
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
