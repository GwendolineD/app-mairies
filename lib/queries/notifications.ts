import type { SupabaseClient } from "@supabase/supabase-js";
import { isContentContextStatus } from "@/lib/constants/content-status";
import { isNotificationKind } from "@/lib/constants/notification-kinds";
import type { ConversationContextType, NotificationItem } from "@/lib/types";
import type { Database } from "@/lib/types/database.types";

export const NOTIFICATIONS_PAGE_SIZE = 20;
export const NOTIFICATIONS_POPOVER_SIZE = 10;

export type NotificationsCursor = { createdAt: string; id: string };

export type NotificationsPage = {
  items: NotificationItem[];
  /** Cursor for the next page, `null` when the last page was reached. */
  nextCursor: NotificationsCursor | null;
};

type RpcRow = Database["public"]["Functions"]["list_my_notifications"]["Returns"][number];

function toItem(row: RpcRow): NotificationItem {
  const payload =
    row.payload && typeof row.payload === "object" && !Array.isArray(row.payload)
      ? (row.payload as Record<string, unknown>)
      : {};
  return {
    id: row.id,
    kind: isNotificationKind(row.kind) ? row.kind : "system",
    tag: row.tag ?? null,
    title: row.title ?? null,
    body: row.body ?? null,
    payload,
    context_type: (row.context_type as ConversationContextType | null) ?? null,
    context_id: row.context_id ?? null,
    read_at: row.read_at ?? null,
    created_at: row.created_at,
    context_status: isContentContextStatus(row.context_status)
      ? row.context_status
      : "available",
    is_author: row.is_author === true,
  };
}

/**
 * Notifications of the current user for a commune, newest first.
 * Single round-trip via the `list_my_notifications` RPC, which also resolves
 * the related content status and whether the user authored it.
 */
export async function listMyNotifications(
  supabase: SupabaseClient<Database>,
  communeId: string,
  options: { limit?: number; before?: NotificationsCursor } = {},
): Promise<NotificationsPage> {
  const limit = options.limit ?? NOTIFICATIONS_PAGE_SIZE;
  // Fetch one extra row to know whether another page exists.
  const { data, error } = await supabase.rpc("list_my_notifications", {
    p_commune_id: communeId,
    p_limit: limit + 1,
    p_before_created_at: options.before?.createdAt,
    p_before_id: options.before?.id,
  });

  if (error) {
    console.error("[notifications] list_my_notifications failed", {
      code: error.code,
      message: error.message,
    });
    return { items: [], nextCursor: null };
  }

  const rows = data ?? [];
  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit).map(toItem);
  const last = items[items.length - 1];
  return {
    items,
    nextCursor: hasMore && last ? { createdAt: last.created_at, id: last.id } : null,
  };
}

/** Unread notifications for the badge, scoped to a commune. */
export async function countUnreadNotifications(
  supabase: SupabaseClient<Database>,
  communeId: string,
): Promise<number> {
  const { data, error } = await supabase.rpc("count_unread_notifications", {
    p_commune_id: communeId,
  });
  if (error || data === null) return 0;
  return data;
}
