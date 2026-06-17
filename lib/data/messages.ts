// @ts-nocheck
import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  ConversationListEntry,
  ContextType,
  ParticipantProfile,
  ThreadMessage,
} from "@/lib/types";

type InboxRpcRow = {
  conversation_id: string;
  title: string | null;
  context_type: ContextType | null;
  context_id: string | null;
  updated_at: string;
  other_user_id: string | null;
  other_display_name: string | null;
  other_first_name: string | null;
  other_last_name: string | null;
  other_avatar_url: string | null;
  last_message_body: string | null;
  last_message_created_at: string | null;
  last_message_sender_id: string | null;
  unread_count: number;
};

/** Inbox list for the active commune — single round trip via SQL aggregation. */
export async function getConversationInbox(
  communeId: string,
): Promise<ConversationListEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_conversation_inbox", {
    p_commune_id: communeId,
  });

  if (error || !data) return [];

  return (data as InboxRpcRow[]).map((row) => ({
    id: row.conversation_id,
    title: row.title,
    context_type: row.context_type,
    context_id: row.context_id,
    updated_at: row.updated_at,
    otherParticipant: row.other_user_id
      ? {
          user_id: row.other_user_id,
          display_name: row.other_display_name,
          first_name: row.other_first_name,
          last_name: row.other_last_name,
          avatar_url: row.other_avatar_url,
        }
      : null,
    lastMessage: row.last_message_created_at
      ? {
          body: row.last_message_body ?? "",
          created_at: row.last_message_created_at,
          sender_id: row.last_message_sender_id ?? "",
        }
      : null,
    unreadCount: row.unread_count ?? 0,
  }));
}

export async function getUnreadCount(communeId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_unread_message_count", {
    p_commune_id: communeId,
  });
  if (error || typeof data !== "number") return 0;
  return data;
}

export type ThreadData = {
  id: string;
  title: string | null;
  context_type: ContextType | null;
  context_id: string | null;
  otherParticipant: ParticipantProfile | null;
  messages: ThreadMessage[];
};

const MESSAGE_PAGE_SIZE = 200;

/**
 * Load a conversation the current user participates in (RLS enforces access).
 * Returns null when the conversation is missing or the user is not a member.
 */
export async function getThread(
  conversationId: string,
  currentUserId: string,
): Promise<ThreadData | null> {
  const supabase = await createClient();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, title, context_type, context_id")
    .eq("id", conversationId)
    .single();

  if (!conversation) return null;

  const { data: participants } = await supabase
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId);

  const participantIds = (participants ?? []).map(
    (p) => (p as { user_id: string }).user_id,
  );

  // No direct FK between conversation_participants and profiles, so resolve
  // the profile slices in a dedicated bounded query.
  const profileByUser = new Map<string, ParticipantProfile>();
  if (participantIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, first_name, last_name, avatar_url")
      .in("user_id", participantIds);
    for (const profile of profiles ?? []) {
      profileByUser.set(
        (profile as ParticipantProfile).user_id,
        profile as ParticipantProfile,
      );
    }
  }

  const otherParticipant =
    participantIds
      .filter((uid) => uid !== currentUserId)
      .map((uid) => profileByUser.get(uid) ?? null)
      .find((p): p is ParticipantProfile => p !== null) ?? null;

  const { data: rawMessages } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, body, created_at, edited_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(MESSAGE_PAGE_SIZE);

  const messages: ThreadMessage[] = (rawMessages ?? []).map((m) => ({
    ...(m as ThreadMessage),
    sender: profileByUser.get((m as { sender_id: string }).sender_id) ?? null,
  }));

  return {
    id: conversation.id as string,
    title: (conversation as { title: string | null }).title,
    context_type: (conversation as { context_type: ContextType | null })
      .context_type,
    context_id: (conversation as { context_id: string | null }).context_id,
    otherParticipant,
    messages,
  };
}
