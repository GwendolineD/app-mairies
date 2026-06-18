"use server";

import { revalidatePath } from "next/cache";
import { requireCommuneStaff } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";
import { communeSettingsSchema } from "@/lib/validations/schemas";

export async function updateCommuneWelcomeMessage(formData: FormData): Promise<void> {
  const { communeId } = await requireCommuneStaff();

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
  revalidatePath(ROUTES.mairie.dashboard);
}

export async function setReportReviewed(reportId: string): Promise<void> {
  await requireCommuneStaff();
  const supabase = await createClient();

  const { error } = await supabase
    .from("reports")
    .update({
      status: "reviewed",
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (error) return;
  revalidatePath(ROUTES.mairie.signalements);
}

export async function markReportHandledForm(formData: FormData): Promise<void> {
  const reportId = formData.get("reportId");
  if (typeof reportId !== "string" || !reportId) return;
  await setReportReviewed(reportId);
}
