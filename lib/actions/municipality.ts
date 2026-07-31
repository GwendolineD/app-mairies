"use server";

import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit/log";
import {
  requireCommuneStaff,
  requirePlatformAdmin,
} from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";
import { communeSettingsSchema } from "@/lib/validations/schemas";

export async function updateCommuneWelcomeMessage(formData: FormData): Promise<void> {
  const { communeId, userId } = await requireCommuneStaff();

  const raw = Object.fromEntries(
    [...formData.entries()].map(([k, v]) => [k, String(v)]),
  ) as Record<string, string>;

  const parsed = communeSettingsSchema.safeParse(raw);
  if (!parsed.success) return;

  const supabase = await createClient();

  const { data: commune } = await supabase
    .from("communes")
    .select("settings")
    .eq("id", communeId)
    .single();

  const nextSettings = {
    ...(commune?.settings as Record<string, unknown>),
    welcomeMessage: parsed.data.welcomeMessage,
    openingHours: parsed.data.openingHours,
    phone: parsed.data.phone,
    address: parsed.data.address,
    referentName: parsed.data.referentName,
    referentRole: parsed.data.referentRole,
  };

  const { error } = await supabase
    .from("communes")
    .update({ settings: nextSettings })
    .eq("id", communeId);

  if (error) return;

  void logAudit({
    action: "admin.update_commune_settings",
    category: "admin",
    userId,
    targetType: "commune",
    targetId: communeId,
    communeId,
  });

  revalidatePath(ROUTES.mairie.dashboard);
}

async function requireReportResolverAuth(): Promise<{ userId: string }> {
  try {
    const ctx = await requireCommuneStaff();
    return { userId: ctx.userId };
  } catch {
    const ctx = await requirePlatformAdmin();
    return { userId: ctx.userId };
  }
}

export async function setReportReviewed(reportId: string): Promise<void> {
  const { userId } = await requireReportResolverAuth();
  const supabase = await createClient();

  const { error } = await supabase
    .from("reports")
    .update({
      status: "reviewed",
      reviewed_at: new Date().toISOString(),
      reviewed_by_user_id: userId,
    })
    .eq("id", reportId);

  if (error) return;
  revalidatePath(ROUTES.mairie.signalements);
  revalidatePath(ROUTES.backoffice.signalements);
  revalidatePath("/backoffice", "layout");
}

export async function resolveReportAction(
  reportId: string,
  resolution: "content_suspended" | "user_suspended" | "dismissed",
): Promise<void> {
  const { userId } = await requireReportResolverAuth();
  const supabase = await createClient();

  const { error } = await supabase
    .from("reports")
    .update({
      status: "reviewed",
      reviewed_at: new Date().toISOString(),
      reviewed_by_user_id: userId,
      resolution,
    })
    .eq("id", reportId);

  if (error) return;

  void logAudit({
    action: "moderation.resolve_report",
    category: "moderation",
    userId,
    targetType: "report",
    targetId: reportId,
    metadata: { resolution },
  });

  revalidatePath(ROUTES.mairie.signalements);
  revalidatePath(ROUTES.backoffice.signalements);
  revalidatePath("/backoffice", "layout");
}

export async function markReportHandledForm(formData: FormData): Promise<void> {
  const reportId = formData.get("reportId");
  if (typeof reportId !== "string" || !reportId) return;
  await setReportReviewed(reportId);
}
