/**
 * Fanout helpers: when a new announcement / initiative / event is published,
 * notify every member of the commune that opted-in via their notification
 * preferences. Each notification is *also* persisted in `public.notifications`
 * so users see them in-app even without push.
 *
 * Sujet 4 rewrite:
 * - Uses a SQL RPC for recipient selection (avoids 414 URI Too Long on .in())
 * - Paginates by 150-user pages (well below 8KB URL limit and max_rows)
 * - Bulk insert into notifications, bulk select from push_subscriptions
 * - Bounded concurrency for push delivery (~20 parallel)
 * - Returns a summary for observability
 */

import { ROUTES } from "@/lib/constants/routes";
import { createServiceClient } from "@/lib/supabase/server";
import { sendPushToSubscriptions, type PushPayload } from "@/lib/services/push-notifications";
import type { ConversationContextType } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type FanoutInput = {
  contextType: ConversationContextType;
  contextId: string;
  communeId: string;
  authorUserId: string;
  title: string;
  authorDisplayName?: string | null;
  excludeUserIds?: string[];
};

export type FanoutResult = {
  ok: boolean;
  recipientsResolved: number;
  notificationsInserted: number;
  pushSent: number;
  pushFailed: number;
  durationMs: number;
  error?: string;
};

const PAGE_SIZE = 150;

const KIND_LABEL: Record<ConversationContextType, string> = {
  announcement: "Nouvelle annonce",
  initiative: "Nouvelle initiative",
  event: "Nouvel événement",
};

const ROUTE_BUILDER: Record<ConversationContextType, (id: string) => string> = {
  announcement: (id) => ROUTES.annonces.detail(id),
  initiative: (id) => ROUTES.initiatives.detail(id),
  event: (id) => ROUTES.evenements.detail(id),
};

/**
 * Fan out a "new content" notification to opted-in commune members.
 * Uses the service-role client (RLS bypass) so it can read across users.
 * Author is excluded from recipients.
 *
 * Returns a summary for observability. Logs internally; never throws.
 */
export async function fanoutNewContentNotification(
  input: FanoutInput,
): Promise<FanoutResult> {
  const startTime = Date.now();
  const result: FanoutResult = {
    ok: false,
    recipientsResolved: 0,
    notificationsInserted: 0,
    pushSent: 0,
    pushFailed: 0,
    durationMs: 0,
  };

  try {
    const supabase = await createServiceClient();

    const title = `${KIND_LABEL[input.contextType]} dans votre commune`;
    const authorLabel = input.authorDisplayName ?? "un·e voisin·e";
    const body = `${authorLabel} vient de publier « ${truncate(input.title, 80)} »`;
    const url = ROUTE_BUILDER[input.contextType](input.contextId);
    const tag = `${input.contextType}:${input.contextId}`;
    const payloadJson = {
      kind: "new_content",
      context_type: input.contextType,
      context_id: input.contextId,
    };

    const payload: PushPayload = { title, body, url, tag };

    let afterUserId: string | null = null;
    let hasMore = true;

    while (hasMore) {
      const page = await fetchRecipientPage(
        supabase,
        input.communeId,
        input.contextType,
        input.authorUserId,
        input.excludeUserIds ?? [],
        afterUserId,
      );

      if (page.error) {
        result.error = page.error;
        result.durationMs = Date.now() - startTime;
        console.warn("[fanout] RPC error, aborting", page.error);
        return result;
      }

      const userIds = page.userIds;
      if (userIds.length === 0) {
        hasMore = false;
        break;
      }

      result.recipientsResolved += userIds.length;

      // Bulk insert notifications
      const notificationRows = userIds.map((userId) => ({
        user_id: userId,
        title,
        body,
        payload: { url, tag, ...payloadJson },
      }));

      const { error: insertError } = await supabase
        .from("notifications")
        .insert(notificationRows);

      if (insertError) {
        console.warn("[fanout] notifications insert error", insertError.message);
      } else {
        result.notificationsInserted += userIds.length;
      }

      // Bulk fetch push subscriptions and send
      const pushResult = await sendPushToSubscriptions(supabase, userIds, payload);
      result.pushSent += pushResult.sent;
      result.pushFailed += pushResult.failed;

      // Pagination cursor: move to next page
      if (userIds.length < PAGE_SIZE) {
        hasMore = false;
      } else {
        afterUserId = userIds[userIds.length - 1];
      }
    }

    result.ok = true;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    result.error = message;
    console.warn("[fanout] failed", err);
  }

  result.durationMs = Date.now() - startTime;

  console.log(
    `[fanout] ${input.contextType}:${input.contextId} — ` +
    `recipients=${result.recipientsResolved} notifications=${result.notificationsInserted} ` +
    `push_sent=${result.pushSent} push_failed=${result.pushFailed} ` +
    `duration=${result.durationMs}ms ok=${result.ok}`,
  );

  return result;
}

type PageResult = { userIds: string[]; error?: string };

async function fetchRecipientPage(
  supabase: SupabaseClient<Database>,
  communeId: string,
  contextType: ConversationContextType,
  authorUserId: string,
  excludeUserIds: string[],
  afterUserId: string | null,
): Promise<PageResult> {
  const { data, error } = await supabase.rpc("select_content_notification_recipients", {
    p_commune_id: communeId,
    p_context_type: contextType,
    p_author_user_id: authorUserId,
    p_exclude_user_ids: excludeUserIds.length > 0 ? excludeUserIds : [],
    p_after_user_id: afterUserId ?? "00000000-0000-0000-0000-000000000000",
    p_limit: PAGE_SIZE,
  });

  if (error) {
    return { userIds: [], error: error.message };
  }

  // Handle the special case where afterUserId is null (first page)
  // The RPC uses a comparison > p_after_user_id, so we pass a UUID that sorts before all real UUIDs
  const userIds = (data ?? []).map((row) => row.user_id);
  return { userIds };
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
