import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ConversationInboxItem,
  MessageRow,
  NotificationPreferences,
} from "@/lib/types";

export const CONVERSATIONS_PAGE_SIZE = 30;
export const MESSAGES_PAGE_SIZE = 50;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  notify_message_announcement: true,
  notify_message_initiative: true,
  notify_message_event: true,
  notify_new_announcement: false,
  notify_new_initiative: false,
  notify_new_event: false,
};

/**
 * Returns the inbox for the current authenticated user, scoped to a commune.
 * Single round-trip via the `list_my_conversations` RPC: joins conversations,
 * other participant profile, and per-conversation unread count.
 */
export async function listMyConversations(
  supabase: SupabaseClient,
  communeId: string,
  options: { archived?: boolean } = {},
): Promise<ConversationInboxItem[]> {
  const { data, error } = await supabase.rpc("list_my_conversations", {
    p_commune_id: communeId,
    p_archived: options.archived ?? false,
  });
  if (error) {
    console.error("[messages] list_my_conversations failed", error);
    return [];
  }
  return (data ?? []) as ConversationInboxItem[];
}

/** Returns the latest messages for a conversation (RLS enforces participant). */
export async function listConversationMessages(
  supabase: SupabaseClient,
  conversationId: string,
  limit: number = MESSAGES_PAGE_SIZE,
): Promise<MessageRow[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, body, created_at, edited_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return ((data ?? []) as MessageRow[]).reverse();
}

/** Fetches preferences for the current user — falls back to defaults if no row yet. */
export async function getNotificationPreferences(
  supabase: SupabaseClient,
  userId: string,
): Promise<NotificationPreferences> {
  const { data } = await supabase
    .from("user_notification_preferences")
    .select(
      "notify_message_announcement, notify_message_initiative, notify_message_event, notify_new_announcement, notify_new_initiative, notify_new_event",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return DEFAULT_NOTIFICATION_PREFERENCES;
  return data as NotificationPreferences;
}
