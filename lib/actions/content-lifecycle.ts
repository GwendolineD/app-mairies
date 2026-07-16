"use server";

import { revalidatePath } from "next/cache";

import { requireActiveMembership } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { ROUTES } from "@/lib/constants/routes";
import { DAY_MS } from "@/lib/datetime";

export type ContentType = "announcement" | "initiative" | "event";

export async function snoozeContentNudge(
  contentType: ContentType,
  contentId: string,
): Promise<{ success: boolean; error?: string }> {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();
  const snoozedUntil = new Date(Date.now() + 30 * DAY_MS).toISOString();

  const table =
    contentType === "announcement"
      ? "announcements"
      : contentType === "initiative"
        ? "initiatives"
        : "events";

  // Verify ownership via author_membership_id
  const { data: content } = await supabase
    .from(table)
    .select("author_membership_id")
    .eq("id", contentId)
    .single();

  if (!content || content.author_membership_id !== ctx.activeMembership!.id) {
    return { success: false, error: "Non autorisé" };
  }

  const { error } = await supabase
    .from(table)
    .update({ nudge_snoozed_until: snoozedUntil })
    .eq("id", contentId);

  if (error) return { success: false, error: error.message };

  // Cancel pending email_queue entries for this content
  const service = await createServiceClient();
  await service
    .from("email_queue")
    .update({ status: "cancelled" })
    .eq("related_content_type", contentType)
    .eq("related_content_id", contentId)
    .eq("status", "pending");

  // Revalidate the content page
  const route =
    contentType === "announcement"
      ? ROUTES.annonces.detail(contentId)
      : contentType === "initiative"
        ? ROUTES.initiatives.detail(contentId)
        : ROUTES.evenements.detail(contentId);
  revalidatePath(route);
  revalidatePath(ROUTES.profil);

  return { success: true };
}
