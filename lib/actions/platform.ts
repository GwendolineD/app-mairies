"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";
import type { SubscriptionStatus } from "@/lib/types";

export type PlatformActionResult =
  | { success: true }
  | { success: false; error: string };

export async function setCommuneSubscription(
  communeId: string,
  status: SubscriptionStatus,
): Promise<PlatformActionResult> {
  await requirePlatformAdmin();

  const supabase = await createClient();
  const { error } = await supabase
    .from("communes")
    .update({ subscription_status: status })
    .eq("id", communeId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(ROUTES.backoffice.communes);
  revalidatePath(ROUTES.backoffice.communeDetail(communeId));
  return { success: true };
}

export async function applyCommuneSubscription(formData: FormData): Promise<void> {
  const communeId = String(formData.get("communeId") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "").trim();

  const allowed: SubscriptionStatus[] = ["inactive", "trial", "active"];
  if (!communeId || !allowed.includes(statusRaw as SubscriptionStatus)) return;

  await setCommuneSubscription(communeId, statusRaw as SubscriptionStatus);
}

export async function updateCommuneWelcomeMessageAsAdmin(
  communeId: string,
  welcomeMessage: string,
): Promise<PlatformActionResult> {
  await requirePlatformAdmin();

  if (!communeId) {
    return { success: false, error: "Commune introuvable." };
  }

  const supabase = await createClient();
  const { data: commune, error: fetchError } = await supabase
    .from("communes")
    .select("settings")
    .eq("id", communeId)
    .maybeSingle();

  if (fetchError || !commune) {
    return { success: false, error: "Commune introuvable." };
  }

  const nextSettings = {
    ...(commune.settings as Record<string, unknown>),
    welcomeMessage: welcomeMessage.trim(),
  };

  const { error } = await supabase
    .from("communes")
    .update({ settings: nextSettings })
    .eq("id", communeId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(ROUTES.backoffice.communeDetail(communeId));
  return { success: true };
}

export async function softDeleteAnnouncementByAdmin(id: string) {
  await requirePlatformAdmin();

  const supabase = await createClient();
  const { error } = await supabase
    .from("announcements")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(ROUTES.backoffice.admin);
  return { success: true };
}
