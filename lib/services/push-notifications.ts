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
 *   - VAPID_SUBJECT     (mailto:contact@example.com)
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/server";
import type { ConversationContextType } from "@/lib/types";

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

function getVapid() {
  const publicKey =
    process.env.VAPID_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:no-reply@vie-locale.fr";
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

  // web-push is an optional runtime dependency. Loaded dynamically so that
  // the app keeps building/working even when the package is not installed
  // (e.g. local dev or environments without push). We avoid a static `import`
  // (which would require type declarations) and instead resolve via Function eval.
  type WebPushModule = {
    setVapidDetails: (subject: string, pub: string, priv: string) => void;
    sendNotification: (
      sub: { endpoint: string; keys: { p256dh: string; auth: string } },
      body: string,
      options?: { TTL?: number },
    ) => Promise<unknown>;
  };
  let webpush: WebPushModule | null = null;
  try {
    const dynamicImport = new Function("m", "return import(m)") as (
      m: string,
    ) => Promise<unknown>;
    const mod = (await dynamicImport("web-push").catch(() => null)) as
      | { default?: WebPushModule }
      | WebPushModule
      | null;
    webpush = mod
      ? (("default" in (mod as Record<string, unknown>)
          ? (mod as { default: WebPushModule }).default
          : (mod as WebPushModule)))
      : null;
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
