/**
 * Web Push notification service.
 *
 * Strategy:
 * - Subscriptions are stored in `push_subscriptions` (user-scoped).
 * - Sending uses VAPID + RFC 8291 (Web Push). The actual cryptography is
 *   delegated to `web-push` if installed at runtime. If the package or the
 *   VAPID env vars are missing, sending is a no-op (logged) so the action
 *   layer stays correct in any environment.
 * - Notifications are *additionally* persisted in `public.notifications`
 *   for in-app history (always, regardless of push delivery).
 *
 * Required env vars to actually deliver:
 *   - VAPID_PUBLIC_KEY  (also exposed as NEXT_PUBLIC_VAPID_PUBLIC_KEY for client)
 *   - VAPID_PRIVATE_KEY
 *   - VAPID_SUBJECT     (mailto:contact@tous-voisins.fr)
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/server";
import type { ConversationContextType } from "@/lib/types";
import type { Database } from "@/lib/types/database.types";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

type StoredSubscription = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type PushBatchResult = {
  sent: number;
  failed: number;
};

const PUSH_CONCURRENCY = 20;

function getVapid() {
  const publicKey =
    process.env.VAPID_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:contact@tous-voisins.fr";
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject };
}

/** True if Web Push is operationally configured. */
export function isPushConfigured(): boolean {
  return getVapid() !== null;
}

/**
 * Send a push payload to every subscription registered for `userId`.
 * Failures are logged but do not throw — caller code never blocks the user flow.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<void> {
  const vapid = getVapid();
  if (!vapid) return;

  // web-push relies on native Node APIs. It is loaded with a literal dynamic
  // import (not a Function-wrapped indirection) so Next.js file tracing keeps
  // it in the standalone/serverless output. It is also declared in
  // `serverExternalPackages` so it is required natively instead of bundled.
  let webpush: typeof import("web-push") | null = null;
  try {
    const mod = await import("web-push");
    webpush = (mod.default ?? mod) as typeof import("web-push");
  } catch {
    webpush = null;
  }
  if (!webpush) return;
  const wp = webpush;

  wp.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

  const supabase = await createServiceClient();
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  const subscriptions = (subs ?? []) as StoredSubscription[];
  if (subscriptions.length === 0) return;

  const json = JSON.stringify(payload);
  const stale: string[] = [];

  await Promise.all(
    subscriptions.map(async (s) => {
      try {
        await wp.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          json,
          { TTL: 60 * 60 * 24 },
        );
      } catch (err) {
        const status = (err as { statusCode?: number } | undefined)?.statusCode;
        if (status === 404 || status === 410) {
          stale.push(s.id);
        } else {
          console.warn("[push] delivery failed", err);
        }
      }
    }),
  );

  if (stale.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", stale);
  }
}

/**
 * Send push notifications to all subscriptions for a batch of users.
 * Used by the fanout to avoid N separate queries and N separate client creations.
 *
 * - Bulk fetches subscriptions for all userIds in one query
 * - Sends with bounded concurrency (PUSH_CONCURRENCY)
 * - Bulk deletes stale subscriptions
 * - Returns counts for observability
 */
export async function sendPushToSubscriptions(
  supabase: SupabaseClient<Database>,
  userIds: string[],
  payload: PushPayload,
): Promise<PushBatchResult> {
  const result: PushBatchResult = { sent: 0, failed: 0 };

  if (userIds.length === 0) return result;

  const vapid = getVapid();
  if (!vapid) return result;

  let webpush: typeof import("web-push") | null = null;
  try {
    const mod = await import("web-push");
    webpush = (mod.default ?? mod) as typeof import("web-push");
  } catch {
    webpush = null;
  }
  if (!webpush) return result;
  const wp = webpush;

  wp.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

  // Bulk fetch all subscriptions for these users
  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .in("user_id", userIds);

  if (error) {
    console.warn("[push] subscriptions fetch error", error.message);
    return result;
  }

  const subscriptions = (subs ?? []) as StoredSubscription[];
  if (subscriptions.length === 0) return result;

  const json = JSON.stringify(payload);
  const stale: string[] = [];

  // Send with bounded concurrency
  const sendOne = async (s: StoredSubscription): Promise<boolean> => {
    try {
      await wp.sendNotification(
        {
          endpoint: s.endpoint,
          keys: { p256dh: s.p256dh, auth: s.auth },
        },
        json,
        { TTL: 60 * 60 * 24 },
      );
      return true;
    } catch (err) {
      const status = (err as { statusCode?: number } | undefined)?.statusCode;
      if (status === 404 || status === 410) {
        stale.push(s.id);
      } else {
        console.warn("[push] delivery failed", err);
      }
      return false;
    }
  };

  // Process in batches of PUSH_CONCURRENCY
  for (let i = 0; i < subscriptions.length; i += PUSH_CONCURRENCY) {
    const batch = subscriptions.slice(i, i + PUSH_CONCURRENCY);
    const results = await Promise.all(batch.map(sendOne));
    for (const ok of results) {
      if (ok) result.sent++;
      else result.failed++;
    }
  }

  // Bulk delete stale subscriptions
  if (stale.length > 0) {
    const { error: deleteError } = await supabase
      .from("push_subscriptions")
      .delete()
      .in("id", stale);
    if (deleteError) {
      console.warn("[push] stale cleanup error", deleteError.message);
    }
  }

  return result;
}

/**
 * Persist an in-app notification row AND attempt to deliver a push.
 * Use this from server actions after the user has been authorized to act.
 */
export async function notifyUser(
  recipientUserId: string,
  payload: PushPayload & { payloadJson?: Record<string, unknown> },
): Promise<void> {
  let supabase: SupabaseClient;
  try {
    supabase = await createServiceClient();
  } catch {
    return;
  }

  await supabase.from("notifications").insert({
    user_id: recipientUserId,
    title: payload.title,
    body: payload.body,
    payload: {
      url: payload.url,
      tag: payload.tag,
      ...(payload.payloadJson ?? {}),
    },
  });

  await sendPushToUser(recipientUserId, payload);
}

/**
 * Look up the per-user notification preference flag that gates a message.
 * Returns `true` by default if no row exists (matches DB defaults).
 */
export async function shouldNotifyMessage(
  supabase: SupabaseClient,
  recipientUserId: string,
  contextType: ConversationContextType | null,
): Promise<boolean> {
  if (!contextType) return true;
  const column =
    contextType === "announcement"
      ? "notify_message_announcement"
      : contextType === "initiative"
        ? "notify_message_initiative"
        : "notify_message_event";

  const { data } = await supabase
    .from("user_notification_preferences")
    .select(column)
    .eq("user_id", recipientUserId)
    .maybeSingle();

  if (!data) return true;
  return (data as Record<string, boolean>)[column] !== false;
}
