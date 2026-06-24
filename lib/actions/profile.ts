"use server";

import { revalidatePath } from "next/cache";
import { requireActiveMembership } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";
import {
  addressUpdateSchema,
  avatarUpdateSchema,
  nameUpdateSchema,
} from "@/lib/validations/schemas";
import { formatDisplayName } from "@/lib/utils/display-name";

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

export type ProfileActionResult = { success: true } | { error: string };

export async function updateName(input: {
  firstName: string;
  lastName: string;
}): Promise<ProfileActionResult> {
  const ctx = await requireActiveMembership();
  const parsed = nameUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const displayName = formatDisplayName(
    parsed.data.firstName,
    parsed.data.lastName,
  );

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      display_name: displayName,
    })
    .eq("user_id", ctx.userId);

  if (error) {
    return { error: "Impossible de mettre à jour le nom." };
  }

  revalidatePath(ROUTES.profil);
  return { success: true };
}

export async function updateAddress(input: {
  addressStreet: string;
  addressCity: string;
  addressPostcode: string;
  addressLat: number;
  addressLng: number;
}): Promise<ProfileActionResult> {
  const ctx = await requireActiveMembership();
  const membership = ctx.activeMembership;

  if (!membership) {
    return { error: "Adhésion active introuvable." };
  }

  const parsed = addressUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("memberships")
    .update({
      address_street: parsed.data.addressStreet,
      address_postcode: parsed.data.addressPostcode,
      address_city: parsed.data.addressCity,
      address_lat: parsed.data.addressLat,
      address_lng: parsed.data.addressLng,
    })
    .eq("id", membership.id)
    .eq("commune_id", membership.commune_id);

  if (error) {
    return { error: "Impossible de mettre à jour l'adresse." };
  }

  revalidatePath(ROUTES.profil);
  return { success: true };
}

export async function updateAvatar(input: {
  avatarUrl: string;
}): Promise<ProfileActionResult> {
  const ctx = await requireActiveMembership();
  const parsed = avatarUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      avatar_url: parsed.data.avatarUrl || null,
    })
    .eq("user_id", ctx.userId);

  if (error) {
    return { error: "Impossible de mettre à jour la photo." };
  }

  revalidatePath(ROUTES.profil);
  return { success: true };
}
