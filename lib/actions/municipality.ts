"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { NEIGHBOR_INVITE_TEMPLATE_KEY } from "@/lib/constants/email-templates";
import { ROUTES } from "@/lib/constants/routes";
import { USER_ROLES } from "@/lib/constants/roles";
import { createClient } from "@/lib/supabase/server";
import { communeSettingsSchema } from "@/lib/validations/schemas";

export async function updateCommuneWelcomeMessage(formData: FormData): Promise<void> {
  const ctx = await requireRole([USER_ROLES.municipalityStaff]);

  const raw = Object.fromEntries(
    [...formData.entries()].map(([k, v]) => [k, String(v)]),
  ) as Record<string, string>;

  const parsed = communeSettingsSchema.safeParse(raw);
  if (!parsed.success) return;

  const communeId = ctx.profile.active_commune_id;
  if (!communeId) return;

  const supabase = await createClient();

  const { data: commune, error: communeError } = await supabase
    .from("communes")
    .select("settings")
    .eq("id", communeId)
    .single();

  if (communeError) {
    console.error("Unable to load commune settings", communeError.message);
    return;
  }

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

  if (error) {
    console.error("Unable to update commune settings", error.message);
    return;
  }
  const { error: templateError } = await supabase
    .from("commune_email_templates")
    .upsert(
      {
        commune_id: communeId,
        template_key: NEIGHBOR_INVITE_TEMPLATE_KEY,
        subject: parsed.data.neighborInviteSubject,
        preheader: parsed.data.neighborInvitePreheader || null,
        body_markdown: parsed.data.neighborInviteBodyMarkdown,
        cta_label: parsed.data.neighborInviteCtaLabel,
      },
      { onConflict: "commune_id,template_key" },
    );

  if (templateError) {
    console.error("Unable to update neighbor invite template", templateError.message);
    return;
  }

  revalidatePath(ROUTES.mairie.dashboard);
  revalidatePath(ROUTES.mairie.parametres);
  revalidatePath(ROUTES.profil);
}

export async function setReportReviewed(reportId: string): Promise<void> {
  await requireRole([USER_ROLES.municipalityStaff]);
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
