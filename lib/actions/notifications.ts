"use server";

import { revalidatePath } from "next/cache";
import { requireActiveMembership } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";
import {
  notificationPreferencesSchema,
  pushSubscriptionSchema,
} from "@/lib/validations/schemas";
import type { NotificationPreferences } from "@/lib/types";

/**
 * Upsert the 6 notification preference booleans for the current user.
 * Form fields are expected to be standard checkboxes: present = "on" = true.
 */
export async function updateNotificationPreferences(
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const ctx = await requireActiveMembership();
  const raw: NotificationPreferences = {
    notify_message_announcement:
      formData.get("notify_message_announcement") === "on",
    notify_message_initiative:
      formData.get("notify_message_initiative") === "on",
    notify_message_event: formData.get("notify_message_event") === "on",
    notify_new_announcement: formData.get("notify_new_announcement") === "on",
    notify_new_initiative: formData.get("notify_new_initiative") === "on",
    notify_new_event: formData.get("notify_new_event") === "on",
  };

  const parsed = notificationPreferencesSchema.safeParse(raw);
  if (!parsed.success) return { error: "Préférences invalides" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("user_notification_preferences")
    .upsert(
      { user_id: ctx.userId, ...parsed.data },
      { onConflict: "user_id" },
    );

  if (error) return { error: error.message };
  revalidatePath(ROUTES.profil);
  return { success: true };
}

/** Returns the public VAPID key required by the browser to subscribe to push. */
export async function getPushPublicKey(): Promise<string | null> {
  return (
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ??
    process.env.VAPID_PUBLIC_KEY ??
    null
  );
}

export async function registerPushSubscription(input: {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
}): Promise<{ error?: string; success?: boolean }> {
  const ctx = await requireActiveMembership();
  const parsed = pushSubscriptionSchema.safeParse(input);
  if (!parsed.success) return { error: "Abonnement invalide" };

  const supabase = await createClient();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: ctx.userId,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.p256dh,
      auth: parsed.data.auth,
      user_agent: parsed.data.userAgent ?? null,
    },
    { onConflict: "endpoint" },
  );
  if (error) return { error: error.message };
  return { success: true };
}

export async function unregisterPushSubscription(
  endpoint: string,
): Promise<{ success: boolean }> {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();
  await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", ctx.userId)
    .eq("endpoint", endpoint);
  return { success: true };
}

export async function dismissNotificationPrompt(): Promise<void> {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();

  await supabase
    .from("profiles")
    .update({ has_dismissed_notification_prompt: true })
    .eq("user_id", ctx.userId);

  revalidatePath("/accueil");
}
