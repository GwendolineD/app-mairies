// @ts-nocheck
"use client";

import { useCallback, useEffect, useState } from "react";
import { savePushSubscription } from "@/lib/actions/messages";
import { Button } from "@/components/ui/button";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const output = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

/**
 * Registers the service worker and, once the user grants permission, persists
 * the web push subscription so the backend can notify this device on new
 * messages. Shows a discreet opt-in banner while permission is undecided.
 */
export function PushRegistrar() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("denied");
  const [dismissed, setDismissed] = useState(false);

  const subscribe = useCallback(async () => {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        }));

      const json = subscription.toJSON();
      if (!json.keys?.p256dh || !json.keys?.auth) return;

      await savePushSubscription({
        endpoint: subscription.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
        userAgent: navigator.userAgent,
      });
    } catch {
      // Push is best-effort; ignore subscription failures.
    }
  }, []);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      return;
    }

    let cancelled = false;
    navigator.serviceWorker.register("/sw.js").then(
      () => {
        if (cancelled) return;
        setSupported(true);
        setPermission(Notification.permission);
        if (Notification.permission === "granted") void subscribe();
      },
      () => {},
    );

    return () => {
      cancelled = true;
    };
  }, [subscribe]);

  const enable = useCallback(async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") await subscribe();
    else setDismissed(true);
  }, [subscribe]);

  if (!supported || permission !== "default" || dismissed) return null;

  return (
    <div className="fixed inset-x-0 bottom-24 z-40 flex justify-center px-4 md:bottom-6 md:right-6 md:left-auto md:justify-end">
      <div className="flex w-full max-w-sm items-center gap-3 rounded-2xl border border-border/60 bg-surface p-4 shadow-elevated">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text">
            Activer les notifications
          </p>
          <p className="text-xs font-medium leading-4 text-muted">
            Soyez prévenu·e sur votre mobile dès qu&apos;un·e voisin·e vous
            écrit.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-1">
          <Button
            type="button"
            onClick={() => void enable()}
            className="px-3 py-1.5 text-xs"
          >
            Activer
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setDismissed(true)}
            className="px-3 py-1 text-xs"
          >
            Plus tard
          </Button>
        </div>
      </div>
    </div>
  );
}
