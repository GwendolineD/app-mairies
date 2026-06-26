"use client";

import { useCallback, useEffect, useState } from "react";
import {
  registerPushSubscription,
  unregisterPushSubscription,
} from "@/lib/actions/notifications";
import { isPushSupported, urlBase64ToUint8Array } from "@/lib/utils/push-subscription";

export type PushSubscriptionState = "idle" | "loading" | "on" | "off" | "blocked";

export type ActivatePushResult =
  | { ok: true }
  | { ok: false; blocked?: boolean; error: string };

async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;
  return navigator.serviceWorker.register("/sw.js");
}

export async function getExistingPushSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return null;
  return registration.pushManager.getSubscription();
}

async function syncPushSubscriptionWithServer(subscription: PushSubscription): Promise<string | null> {
  const json = subscription.toJSON();
  const result = await registerPushSubscription({
    endpoint: subscription.endpoint,
    p256dh: json.keys?.p256dh ?? "",
    auth: json.keys?.auth ?? "",
    userAgent: navigator.userAgent,
  });
  return result.error ?? null;
}

/** Must be called synchronously from a user click — requestPermission runs first. */
export async function activatePushSubscription(
  pushPublicKey: string,
): Promise<ActivatePushResult> {
  if (!isPushSupported()) {
    return { ok: false, error: "Votre navigateur ne supporte pas les notifications push." };
  }

  if (Notification.permission === "denied") {
    return { ok: false, blocked: true, error: "Notifications bloquées par le navigateur." };
  }

  if (Notification.permission === "default") {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { ok: false, blocked: true, error: "Autorisation refusée." };
    }
  }

  try {
    const registration = await getServiceWorkerRegistration();
    await navigator.serviceWorker.ready;

    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      const syncError = await syncPushSubscriptionWithServer(existing);
      if (syncError) return { ok: false, error: syncError };
      return { ok: true };
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(pushPublicKey).buffer as ArrayBuffer,
    });
    const syncError = await syncPushSubscriptionWithServer(subscription);
    if (syncError) return { ok: false, error: syncError };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export function usePushSubscription(pushPublicKey: string | null) {
  const [state, setState] = useState<PushSubscriptionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const supported = isPushSupported();

  const refreshSubscriptionState = useCallback(async () => {
    if (!supported) return;
    try {
      await navigator.serviceWorker.ready;
      const sub = await getExistingPushSubscription();
      setState(sub ? "on" : "idle");
    } catch {
      // Keep current state
    }
  }, [supported]);

  useEffect(() => {
    void refreshSubscriptionState();
  }, [refreshSubscriptionState]);

  const enable = useCallback(async (): Promise<boolean> => {
    setError(null);
    if (!pushPublicKey) {
      setError(
        "Notifications push non configurées sur ce serveur (clé VAPID manquante).",
      );
      return false;
    }
    setState("loading");
    const result = await activatePushSubscription(pushPublicKey);
    if (result.ok) {
      setState("on");
      return true;
    }
    setError(result.error);
    setState(result.blocked ? "blocked" : "idle");
    return false;
  }, [pushPublicKey]);

  const disable = useCallback(async () => {
    setState("loading");
    try {
      const sub = await getExistingPushSubscription();
      if (sub) {
        await unregisterPushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setState("off");
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  return { state, error, supported, enable, disable, refreshSubscriptionState };
}
