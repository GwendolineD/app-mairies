"use server";

import { revalidatePath } from "next/cache";
import { requireActiveMembership } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";
import { profileUpdateSchema } from "@/lib/validations/schemas";

export async function updateNotificationPreferences(formData: FormData): Promise<void> {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase
    .from("profile_notification_preferences")
    .upsert({
      user_id: ctx.userId,
      message_notifications_enabled:
        formData.get("messageNotificationsEnabled") === "on",
      announcement_notifications_enabled:
        formData.get("announcementNotificationsEnabled") === "on",
      initiative_notifications_enabled:
        formData.get("initiativeNotificationsEnabled") === "on",
    });

  if (error) {
    console.error("Unable to update notification preferences", error.message);
    return;
  }

  revalidatePath(ROUTES.profil);
}

export type UpdateProfileResult = { success: true } | { error: string };

export async function updateProfile(
  input: { displayName: string; bio?: string; avatarUrl?: string },
): Promise<UpdateProfileResult> {
  const ctx = await requireActiveMembership();

  const parsed = profileUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Données invalides" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      bio: parsed.data.bio ?? null,
      avatar_url: parsed.data.avatarUrl || null,
    })
    .eq("user_id", ctx.userId);

  if (error) {
    return { error: "Impossible de mettre à jour le profil." };
  }

  revalidatePath(ROUTES.profil);
  return { success: true };
}
