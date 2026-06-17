"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, requireActiveMembership } from "@/lib/auth/session";
import { NEIGHBOR_INVITE_TEMPLATE_KEY } from "@/lib/constants/email-templates";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/utils/app-url";
import {
  buildMailtoHref,
  normalizeNeighborInviteTemplate,
  renderNeighborInviteTemplate,
} from "@/lib/utils/email-template";
import { messageSchema } from "@/lib/validations/schemas";
import {
  notifyUser,
  shouldNotifyMessage,
} from "@/lib/services/push-notifications";
import type { ConversationContextType } from "@/lib/types";

export type NeighborInviteState = {
  success?: boolean;
  error?: string;
  email?: string;
  mailtoHref?: string;
  subject?: string;
  body?: string;
};

type ActionResult<T> = ({ ok: true } & T) | { ok: false; error: string };

function normalizePair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

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

type EnsureResult = {
  conversationId: string | null;
  error: string | null;
};

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
    return { error: error?.message ?? "Impossible de créer la conversation.", conversationId: null };
  }

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

/**
 * @deprecated Use ensureConversation directly. Kept for backward compat.
 */
export async function ensureContextConversation(
  contextType: ConversationContextType,
  contextId: string,
): Promise<ActionResult<{ conversationId: string }>> {
  const result = await ensureConversation(contextType, contextId);
  if (result.conversationId) {
    return { ok: true, conversationId: result.conversationId };
  }
  return { ok: false, error: result.error ?? "Impossible d'ouvrir la conversation." };
}

async function insertConversationMessage(
  conversationId: string,
  body: string,
): Promise<{ success: true; messageId: string } | { error: string }> {
  const ctx = await requireActiveMembership();
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

  const { data: inserted, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: ctx.userId,
      body,
    })
    .select("id")
    .single();
  if (error || !inserted) return { error: error?.message ?? "Erreur insertion" };

  await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString(), archived_at: null })
    .eq("conversation_id", conversationId)
    .eq("user_id", ctx.userId);

  const allowed = await shouldNotifyMessage(
    supabase,
    recipientUserId,
    conversation.context_type as ConversationContextType | null,
  );
  if (allowed) {
    const senderName = ctx.profile.display_name ?? "Un·e voisin·e";
    const preview = body.slice(0, 140);
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
  return { success: true, messageId: inserted.id };
}

export async function sendConversationMessage(formData: FormData) {
  const conversationId = formData.get("conversationId") as string;
  const body = formData.get("body") as string;

  const parsed = messageSchema.safeParse({ body });
  if (!parsed.success) return { error: "Message invalide" };

  return insertConversationMessage(conversationId, parsed.data.body);
}

export async function sendDirectMessage(
  conversationId: string,
  body: string,
): Promise<{ ok: true; messageId: string } | { ok: false; error: string }> {
  const parsed = messageSchema.safeParse({ body });
  if (!parsed.success) return { ok: false, error: "Message invalide" };

  const result = await insertConversationMessage(conversationId, parsed.data.body);
  if ("error" in result) return { ok: false, error: result.error };
  return { ok: true, messageId: result.messageId };
}

const CONTEXT_TYPES: ConversationContextType[] = [
  "announcement",
  "initiative",
  "event",
];

export async function sendContextMessage(formData: FormData) {
  const contextType = formData.get("contextType") as ConversationContextType;
  const contextId = formData.get("contextId") as string;
  const body = formData.get("body") as string;

  if (!CONTEXT_TYPES.includes(contextType)) {
    return { error: "Contexte invalide", conversationId: null };
  }
  if (!contextId) {
    return { error: "Élément introuvable", conversationId: null };
  }

  const parsed = messageSchema.safeParse({ body });
  if (!parsed.success) {
    return { error: "Message invalide", conversationId: null };
  }

  const ensured = await ensureConversation(contextType, contextId);
  if (!ensured.conversationId) {
    return { error: ensured.error ?? "Erreur", conversationId: null };
  }

  const sent = await insertConversationMessage(
    ensured.conversationId,
    parsed.data.body,
  );
  if ("error" in sent) {
    return { error: sent.error, conversationId: null };
  }

  return { success: true as const, conversationId: ensured.conversationId };
}

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

export async function createNeighborInvite(
  _state: NeighborInviteState | undefined,
  formData: FormData,
): Promise<NeighborInviteState> {
  const ctx = await requireActiveMembership();

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { error: "Adresse e-mail invalide." };
  }

  const supabase = await createClient();
  const randomPart = [...crypto.getRandomValues(new Uint8Array(16))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const communeId = ctx.activeMembership!.commune_id;
  const token = `${randomPart}`;
  const { error } = await supabase.from("neighbor_invites").insert({
    inviter_membership_id: ctx.activeMembership!.id,
    commune_id: communeId,
    email,
    token,
    expires_at: null,
  });

  if (error) {
    console.error("Unable to create neighbor invite", error.message);
    return { error: "Impossible de préparer l'invitation pour le moment." };
  }

  const { data: template, error: templateError } = await supabase
    .from("commune_email_templates")
    .select("subject, preheader, body_markdown, cta_label")
    .eq("commune_id", communeId)
    .eq("template_key", NEIGHBOR_INVITE_TEMPLATE_KEY)
    .maybeSingle();

  if (templateError) {
    console.error("Unable to load neighbor invite template", templateError.message);
  }

  const profileName = [ctx.profile.first_name, ctx.profile.last_name]
    .filter(Boolean)
    .join(" ");
  const senderName = ctx.profile.display_name || profileName || "Un voisin";
  const communeName = ctx.activeMembership?.commune?.name ?? "votre commune";
  const inviteLink = `${getAppUrl()}${ROUTES.inscription.root}?invite=${token}`;
  const normalizedTemplate = normalizeNeighborInviteTemplate(template);
  const rendered = renderNeighborInviteTemplate(normalizedTemplate, {
    senderName,
    communeName,
    inviteLink,
  });

  revalidatePath(ROUTES.profil);
  return {
    success: true,
    email,
    mailtoHref: buildMailtoHref({
      email,
      subject: rendered.subject,
      body: rendered.body,
    }),
    subject: rendered.subject,
    body: rendered.body,
  };
}
