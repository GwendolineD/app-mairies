"use server";

import { revalidatePath } from "next/cache";
import { requireActiveMembership } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";
import { messageSchema } from "@/lib/validations/schemas";

function normalizePair(userIdA: string, userIdB: string): [string, string] {
  return userIdA < userIdB ? [userIdA, userIdB] : [userIdB, userIdA];
}

export async function ensureAnnouncementConversation(announcementId: string) {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();
  const communeId = ctx.activeMembership!.commune_id;

  const { data: announcement, error: annError } = await supabase
    .from("announcements")
    .select("id, title, author_membership_id")
    .eq("id", announcementId)
    .eq("commune_id", communeId)
    .single();

  if (annError || !announcement) {
    return { error: "Annonce introuvable", conversationId: null as string | null };
  }

  const { data: authorMembership } = await supabase
    .from("memberships")
    .select("user_id")
    .eq("id", announcement.author_membership_id)
    .single();

  const authorUserId = authorMembership?.user_id;
  if (!authorUserId) {
    return { error: "Auteur introuvable", conversationId: null };
  }

  if (authorUserId === ctx.userId) {
    return { error: "Vous ne pouvez pas vous contacter vous-même", conversationId: null };
  }

  const [participantA, participantB] = normalizePair(ctx.userId, authorUserId);

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("commune_id", communeId)
    .eq("context_type", "announcement")
    .eq("context_id", announcementId)
    .eq("participant_a", participantA)
    .eq("participant_b", participantB)
    .maybeSingle();

  if (existing) {
    return { conversationId: existing.id, error: null as string | null };
  }

  const { data: conv, error } = await supabase
    .from("conversations")
    .insert({
      commune_id: communeId,
      created_by_user_id: ctx.userId,
      context_type: "announcement",
      context_id: announcementId,
      title: announcement.title,
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

export async function sendConversationMessage(formData: FormData) {
  const ctx = await requireActiveMembership();
  const conversationId = formData.get("conversationId") as string;
  const body = formData.get("body") as string;

  const parsed = messageSchema.safeParse({ body });
  if (!parsed.success) return { error: "Message invalide" };

  const supabase = await createClient();

  const { data: participant } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", ctx.userId)
    .maybeSingle();

  if (!participant) return { error: "Conversation inaccessible" };

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: ctx.userId,
    body: parsed.data.body,
  });

  if (error) return { error: error.message };

  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

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
