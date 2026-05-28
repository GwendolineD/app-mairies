"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, requireActiveMembership } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";
import { messageSchema } from "@/lib/validations/schemas";

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
