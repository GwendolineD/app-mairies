"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { USER_ROLES } from "@/lib/constants/roles";
import { createClient } from "@/lib/supabase/server";
import type { SubscriptionStatus } from "@/lib/types";

export async function setCommuneSubscription(
  communeId: string,
  status: SubscriptionStatus,
): Promise<void> {
  await requireRole([USER_ROLES.platformAdmin]);

  const supabase = await createClient();
  const { error } = await supabase
    .from("communes")
    .update({ subscription_status: status })
    .eq("id", communeId);

  if (error) return;
  revalidatePath(ROUTES.platform.communes);
}

export async function applyCommuneSubscription(formData: FormData): Promise<void> {
  const communeId = String(formData.get("communeId") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "").trim();

  const allowed: SubscriptionStatus[] = ["inactive", "trial", "active"];
  if (!communeId || !allowed.includes(statusRaw as SubscriptionStatus)) return;

  await setCommuneSubscription(communeId, statusRaw as SubscriptionStatus);
}

export async function softDeleteAnnouncementByAdmin(id: string) {
  await requireRole([USER_ROLES.platformAdmin]);

  const supabase = await createClient();
  const { error } = await supabase
    .from("announcements")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(ROUTES.platform.admin);
  return { success: true };
}
