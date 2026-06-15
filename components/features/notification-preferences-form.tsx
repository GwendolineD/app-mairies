"use client";

import { useState, useTransition } from "react";
import { Bell, BellOff, CalendarDays, Megaphone, Sparkles } from "lucide-react";
import { updateNotificationPreferences } from "@/lib/actions/notifications";
import {
  registerPushSubscription,
  unregisterPushSubscription,
} from "@/lib/actions/notifications";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { NotificationPreferences } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

type Props = {
  initial: NotificationPreferences;
  pushPublicKey: string | null;
};

const GROUPS: {
  title: string;
  description: string;
  icon: typeof Megaphone;
  items: {
    key: keyof NotificationPreferences;
    label: string;
  }[];
}[] = [
  {
    title: "Messages reçus",
    description:
      "Soyez notifié·e dès qu'un·e voisin·e vous écrit à propos d'un contenu que vous avez publié.",
    icon: Bell,
    items: [
      { key: "notify_message_announcement", label: "Sur mes annonces" },
      { key: "notify_message_initiative", label: "Sur mes initiatives" },
      { key: "notify_message_event", label: "Sur mes événements" },
    ],
  },
  {
    title: "Nouvelles publications dans ma commune",
    description:
      "Recevez une notification quand un·e voisin·e publie du nouveau contenu.",
    icon: Sparkles,
    items: [
      { key: "notify_new_announcement", label: "Nouvelle annonce" },
      { key: "notify_new_initiative", label: "Nouvelle initiative" },
      { key: "notify_new_event", label: "Nouvel événement" },
    ],
  },
];

const GROUP_ICONS: Record<keyof NotificationPreferences, typeof Megaphone> = {
  notify_message_announcement: Megaphone,
  notify_message_initiative: Sparkles,
  notify_message_event: CalendarDays,
  notify_new_announcement: Megaphone,
  notify_new_initiative: Sparkles,
  notify_new_event: CalendarDays,
};

export function NotificationPreferencesForm({ initial, pushPublicKey }: Props) {
  const [prefs, setPrefs] = useState<NotificationPreferences>(initial);
  const [saving, startSaving] = useTransition();
  const [savedAt, setSavedAt] = useState<string | null>(null);

  function toggle(key: keyof NotificationPreferences) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    const formData = new FormData();
    (Object.keys(next) as (keyof NotificationPreferences)[]).forEach((k) => {
      if (next[k]) formData.set(k, "on");
    });
    startSaving(async () => {
      const result = await updateNotificationPreferences(formData);
      if (!result?.error) {
        setSavedAt(new Date().toLocaleTimeString("fr-FR"));
      }
    });
  }

  return (
    <Card className="space-y-5 p-5">
      <header className="space-y-1">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-text">
          <Bell className="size-5 text-purple" aria-hidden />
          Notifications
        </h2>
        <p className="text-sm text-muted">
          Choisissez les notifications mobile que vous souhaitez recevoir.
        </p>
      </header>

      {GROUPS.map((group) => (
        <section key={group.title} className="space-y-2">
          <div>
            <p className="text-sm font-semibold text-text">{group.title}</p>
            <p className="text-xs text-muted">{group.description}</p>
          </div>
          <ul className="divide-y divide-border/60 rounded-2xl border border-border/60">
            {group.items.map(({ key, label }) => {
              const Icon = GROUP_ICONS[key];
              const on = prefs[key];
              return (
                <li
                  key={key}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <span className="flex items-center gap-3 text-sm font-medium text-text">
                    <Icon className="size-4 text-muted" aria-hidden />
                    {label}
                  </span>
                  <Toggle
                    checked={on}
                    onChange={() => toggle(key)}
                    disabled={saving}
                    label={`${label} — ${on ? "activé" : "désactivé"}`}
                  />
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <PushSubscriptionRow pushPublicKey={pushPublicKey} />

      <p
        className={cn(
          "text-xs",
          saving ? "text-purple" : savedAt ? "text-mint" : "text-subtle",
        )}
        aria-live="polite"
      >
        {saving
          ? "Enregistrement…"
          : savedAt
            ? `Préférences enregistrées à ${savedAt}`
            : " "}
      </p>
    </Card>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition",
        checked ? "bg-purple" : "bg-border",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <span
        className={cn(
          "inline-block size-5 transform rounded-full bg-white shadow transition",
          checked ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

type PushState = "idle" | "loading" | "on" | "off" | "blocked";

function PushSubscriptionRow({ pushPublicKey }: { pushPublicKey: string | null }) {
  const [state, setState] = useState<PushState>("idle");
  const [error, setError] = useState<string | null>(null);

  const supported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window;

  async function enable() {
    setError(null);
    if (!pushPublicKey) {
      setError(
        "Notifications push non configurées sur ce serveur (clé VAPID manquante).",
      );
      return;
    }
    if (!supported) {
      setError("Votre navigateur ne supporte pas les notifications push.");
      return;
    }
    setState("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("blocked");
        return;
      }
      const registration =
        (await navigator.serviceWorker.getRegistration("/sw.js")) ??
        (await navigator.serviceWorker.register("/sw.js"));
      await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(pushPublicKey).buffer as ArrayBuffer,
      });
      const json = subscription.toJSON();
      await registerPushSubscription({
        endpoint: subscription.endpoint,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
        userAgent: navigator.userAgent,
      });
      setState("on");
    } catch (e) {
      setError((e as Error).message);
      setState("idle");
    }
  }

  async function disable() {
    setState("loading");
    try {
      const registration = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await registration?.pushManager.getSubscription();
      if (sub) {
        await unregisterPushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setState("off");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <section className="space-y-2 rounded-2xl border border-border/60 bg-warm/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text">
            Notifications push sur ce navigateur
          </p>
          <p className="text-xs text-muted">
            Recevez les notifications même quand l&apos;application est fermée
            (mobile et bureau).
          </p>
        </div>
        {state === "on" ? (
          <Button
            type="button"
            variant="secondary"
            onClick={disable}
          >
            <BellOff className="size-4" aria-hidden /> Désactiver
          </Button>
        ) : (
          <Button
            type="button"
            onClick={enable}
            disabled={state === "loading" || state === "blocked" || !pushPublicKey}
          >
            <Bell className="size-4" aria-hidden />
            {state === "loading" ? "Activation…" : "Activer"}
          </Button>
        )}
      </div>
      {state === "blocked" ? (
        <p className="text-xs text-coral">
          Notifications bloquées par le navigateur. Autorisez-les dans les
          réglages du site puis réessayez.
        </p>
      ) : null}
      {!pushPublicKey ? (
        <p className="text-xs text-subtle">
          Push non configuré (clé VAPID manquante côté serveur). Les préférences
          ci-dessus restent enregistrées et seront utilisées dès activation.
        </p>
      ) : null}
      {error ? <p className="text-xs text-coral">{error}</p> : null}
    </section>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}
