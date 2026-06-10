"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { NEIGHBOR_INVITE_TEMPLATE_KEY } from "@/lib/constants/email-templates";
import { ROUTES } from "@/lib/constants/routes";
import { USER_ROLES } from "@/lib/constants/roles";
import { MEMBERSHIP_STATUS } from "@/lib/constants/statuses";
import { createClient } from "@/lib/supabase/server";
import {
  communeSettingsSchema,
  suspendMembershipSchema,
} from "@/lib/validations/schemas";

export type MembershipActionResult = { error?: string; success?: boolean };

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

// Resolves the active commune of the staff member and confirms the target
// membership belongs to it (defense in depth on top of RLS).
async function resolveStaffCommune(): Promise<{
  communeId: string | null;
}> {
  const ctx = await requireRole([USER_ROLES.municipalityStaff]);
  return { communeId: ctx.profile.active_commune_id };
}

export async function suspendMembership(
  formData: FormData,
): Promise<MembershipActionResult> {
  const { communeId } = await resolveStaffCommune();
  if (!communeId) return { error: "Aucune commune active." };

  const parsed = suspendMembershipSchema.safeParse({
    membershipId: formData.get("membershipId"),
    reason: formData.get("reason") || undefined,
  });
  if (!parsed.success) return { error: "Requête invalide." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("memberships")
    .update({
      status: MEMBERSHIP_STATUS.suspended,
      suspended_at: new Date().toISOString(),
      suspension_reason: parsed.data.reason ?? null,
    })
    .eq("id", parsed.data.membershipId)
    .eq("commune_id", communeId)
    .neq("status", MEMBERSHIP_STATUS.left);

  if (error) return { error: error.message };

  revalidatePath(ROUTES.mairie.habitants);
  revalidatePath(ROUTES.mairie.dashboard);
  return { success: true };
}

export async function reactivateMembership(
  formData: FormData,
): Promise<MembershipActionResult> {
  const { communeId } = await resolveStaffCommune();
  if (!communeId) return { error: "Aucune commune active." };

  const membershipId = String(formData.get("membershipId") ?? "").trim();
  if (!membershipId) return { error: "Requête invalide." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("memberships")
    .update({
      status: MEMBERSHIP_STATUS.active,
      suspended_at: null,
      suspension_reason: null,
    })
    .eq("id", membershipId)
    .eq("commune_id", communeId)
    .eq("status", MEMBERSHIP_STATUS.suspended);

  if (error) return { error: error.message };

  revalidatePath(ROUTES.mairie.habitants);
  revalidatePath(ROUTES.mairie.dashboard);
  return { success: true };
}
