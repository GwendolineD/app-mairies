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

export type NeighborInviteState = {
  success?: boolean;
  error?: string;
  email?: string;
  mailtoHref?: string;
  subject?: string;
  body?: string;
};

export async function ensureDirectConversation(participantUserId?: string) {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();

  if (!participantUserId) {
    return { error: "Destinataire manquant", conversationId: null as string | null };
  }

  const communeId = ctx.activeMembership!.commune_id;

  const { data: conv, error } = await supabase
    .from("conversations")
    .insert({
      commune_id: communeId,
      created_by_user_id: ctx.userId,
      title: "Conversation locale",
      context_type: null,
      context_id: null,
    })
    .select("id")
    .single();

  if (error || !conv) return { error: error?.message ?? "Erreur", conversationId: null };

  await supabase.from("conversation_participants").insert([
    { conversation_id: conv.id, user_id: ctx.userId },
    { conversation_id: conv.id, user_id: participantUserId },
  ]);

  revalidatePath(ROUTES.messages);
  return { conversationId: conv.id, error: null as string | null };
}

export async function sendConversationMessage(formData: FormData) {
  await requireAuth();
  const conversationId = formData.get("conversationId") as string;
  const body = formData.get("body") as string;

  const parsed = messageSchema.safeParse({ body });
  if (!parsed.success) return { error: "Message invalide" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté·e" };

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body: parsed.data.body,
  });

  if (error) return { error: error.message };
  revalidatePath(ROUTES.messages);
  return { success: true };
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
