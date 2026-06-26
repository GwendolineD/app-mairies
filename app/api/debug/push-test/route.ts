import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * TEMPORARY diagnostic endpoint for push notifications in production.
 * Returns non-secret runtime evidence (booleans, public-key prefixes,
 * web-push HTTP status codes) and attempts a real push to the CURRENT user's
 * own subscriptions only. Never returns private keys or full secrets.
 * Remove once the push delivery issue is resolved.
 */
export async function GET() {
  const ctx = await getSessionContext();
  if (!ctx) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const serverPublic =
    process.env.VAPID_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
  const nextPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
  const privateKey = process.env.VAPID_PRIVATE_KEY ?? "";

  const env = {
    hasVapidPublicKey: !!process.env.VAPID_PUBLIC_KEY,
    hasNextPublicVapidPublicKey: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    hasVapidPrivateKey: !!privateKey,
    hasVapidSubject: !!process.env.VAPID_SUBJECT,
    hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    serverPublicPrefix: serverPublic.slice(0, 12),
    serverPublicLength: serverPublic.length,
    nextPublicPrefix: nextPublic.slice(0, 12),
    nextPublicLength: nextPublic.length,
    serverVsNextPublicMatch:
      !!serverPublic && !!nextPublic && serverPublic === nextPublic,
  };

  // Load web-push dynamically (optional runtime dependency).
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
      ? "default" in (mod as Record<string, unknown>)
        ? (mod as { default: WebPushModule }).default
        : (mod as WebPushModule)
      : null;
  } catch {
    webpush = null;
  }

  const service = await createServiceClient();
  const { data: subs, error: subsError } = await service
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", ctx.userId);

  const subscriptions = (subs ?? []) as {
    id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
  }[];

  const result = {
    userId: ctx.userId,
    env,
    webPushLoaded: !!webpush,
    subscriptions: {
      count: subscriptions.length,
      error: subsError?.message ?? null,
      hosts: subscriptions.map((s) => {
        try {
          return new URL(s.endpoint).host;
        } catch {
          return "bad";
        }
      }),
    },
    sendAttempts: [] as Array<{
      host: string;
      ok: boolean;
      statusCode: number | null;
      body: string | null;
    }>,
  };

  if (webpush && privateKey && serverPublic && subscriptions.length > 0) {
    const subject = process.env.VAPID_SUBJECT ?? "mailto:contact@tous-voisins.fr";
    try {
      webpush.setVapidDetails(subject, serverPublic, privateKey);
    } catch (e) {
      result.sendAttempts.push({
        host: "setVapidDetails",
        ok: false,
        statusCode: null,
        body: String((e as Error)?.message ?? "").slice(0, 300),
      });
    }
    const payload = JSON.stringify({
      title: "Test diagnostic",
      body: "Si vous voyez ceci, le push fonctionne.",
      url: "/accueil",
      tag: "debug-push-test",
    });
    for (const s of subscriptions) {
      let host = "bad";
      try {
        host = new URL(s.endpoint).host;
      } catch {
        // keep "bad"
      }
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
          { TTL: 60 },
        );
        result.sendAttempts.push({ host, ok: true, statusCode: 201, body: null });
      } catch (err) {
        const statusCode =
          (err as { statusCode?: number } | undefined)?.statusCode ?? null;
        const body = String((err as { body?: unknown })?.body ?? "").slice(0, 300);
        result.sendAttempts.push({ host, ok: false, statusCode, body });
      }
    }
  }

  return NextResponse.json(result);
}
