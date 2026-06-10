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

export async function updateProfile(formData: FormData): Promise<void> {
  const ctx = await requireActiveMembership();
  const raw = {
    displayName: formData.get("displayName") as string,
    bio: (formData.get("bio") as string) || undefined,
    avatarUrl: (formData.get("avatarUrl") as string) || "",
  };

  const parsed = profileUpdateSchema.safeParse(raw);
  if (!parsed.success) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      bio: parsed.data.bio ?? null,
      avatar_url: parsed.data.avatarUrl || null,
    })
    .eq("user_id", ctx.userId);

  if (error) return;
  revalidatePath(ROUTES.profil);
}
