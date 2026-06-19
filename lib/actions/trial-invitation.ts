"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePlatformAdmin, requireCommuneStaff } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { sendTemplatedEmail } from "@/lib/email/render-template";
import { createClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/utils/app-url";
import { generateTrialCode } from "@/lib/utils/trial-code";

export type TrialActionResult =
  | { success: true }
  | { success: false; error: string };

const MAX_BATCH = 20;

const emailListSchema = z
  .string()
  .min(1, "Au moins un email est requis.")
  .transform((v) =>
    v
      .split(/[,;\n]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  )
  .pipe(
    z
      .array(z.string().email("Email invalide"))
      .min(1, "Au moins un email est requis.")
      .max(MAX_BATCH, `Maximum ${MAX_BATCH} emails par envoi.`),
  );

async function requireTrialCommuneAccess(communeId: string) {
  const supabase = await createClient();
  const { data: commune } = await supabase
    .from("communes")
    .select(
      "id, name, postcode, insee_code, access_status, trial_access_code, trial_max_members",
    )
    .eq("id", communeId)
    .single();

  if (!commune) {
    return { error: "Commune introuvable." as const, commune: null };
  }

  return { error: null, commune };
}

export async function regenerateTrialCode(
  communeId: string,
): Promise<TrialActionResult> {
  await requirePlatformAdmin();

  const supabase = await createClient();
  const newCode = generateTrialCode();

  const { error } = await supabase
    .from("communes")
    .update({ trial_access_code: newCode })
    .eq("id", communeId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(ROUTES.backoffice.communeDetail(communeId));
  return { success: true };
}

export async function regenerateTrialCodeAsMairie(
  communeId: string,
): Promise<TrialActionResult> {
  const { communeId: staffCommuneId } = await requireCommuneStaff();
  if (staffCommuneId !== communeId) {
    return { success: false, error: "Non autorisé." };
  }

  const supabase = await createClient();
  const newCode = generateTrialCode();

  const { error } = await supabase
    .from("communes")
    .update({ trial_access_code: newCode })
    .eq("id", communeId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(ROUTES.mairie.dashboard);
  return { success: true };
}

export async function updateTrialMaxMembers(
  communeId: string,
  maxMembers: number,
): Promise<TrialActionResult> {
  await requirePlatformAdmin();

  if (!Number.isInteger(maxMembers) || maxMembers < 1 || maxMembers > 1000) {
    return { success: false, error: "Le nombre doit être entre 1 et 1000." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("communes")
    .update({ trial_max_members: maxMembers })
    .eq("id", communeId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(ROUTES.backoffice.communeDetail(communeId));
  return { success: true };
}

export async function sendTrialInvitations(
  communeId: string,
  rawEmails: string,
): Promise<TrialActionResult & { sentCount?: number }> {
  await requireCommuneStaff();

  const { error: communeError, commune } =
    await requireTrialCommuneAccess(communeId);
  if (communeError || !commune) {
    return { success: false, error: communeError ?? "Commune introuvable." };
  }

  if (commune.access_status !== "trial") {
    return {
      success: false,
      error: "Les invitations ne sont disponibles qu'en mode essai.",
    };
  }

  if (!commune.trial_access_code) {
    return { success: false, error: "Aucun code d'accès configuré." };
  }

  const parsed = emailListSchema.safeParse(rawEmails);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Emails invalides.";
    return { success: false, error: msg };
  }

  const emails = parsed.data;
  const baseUrl = getAppUrl();

  const results = await Promise.allSettled(
    emails.map((email) => {
      const signupUrl = `${baseUrl}/inscription?commune=${encodeURIComponent(commune.insee_code)}&code=${encodeURIComponent(commune.trial_access_code!)}&email=${encodeURIComponent(email)}`;
      return sendTemplatedEmail(email, "trial-invitation", {
        commune_name: commune.name,
        access_code: commune.trial_access_code!,
        signup_url: signupUrl,
      });
    }),
  );

  return summarizeInvitationResults(results);
}

export async function sendTrialInvitationsAsAdmin(
  communeId: string,
  rawEmails: string,
): Promise<TrialActionResult & { sentCount?: number }> {
  await requirePlatformAdmin();

  const { error: communeError, commune } =
    await requireTrialCommuneAccess(communeId);
  if (communeError || !commune) {
    return { success: false, error: communeError ?? "Commune introuvable." };
  }

  if (commune.access_status !== "trial") {
    return {
      success: false,
      error: "Les invitations ne sont disponibles qu'en mode essai.",
    };
  }

  if (!commune.trial_access_code) {
    return { success: false, error: "Aucun code d'accès configuré." };
  }

  const parsed = emailListSchema.safeParse(rawEmails);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Emails invalides.";
    return { success: false, error: msg };
  }

  const emails = parsed.data;
  const baseUrl = getAppUrl();

  const results = await Promise.allSettled(
    emails.map((email) => {
      const signupUrl = `${baseUrl}/inscription?commune=${encodeURIComponent(commune.insee_code)}&code=${encodeURIComponent(commune.trial_access_code!)}&email=${encodeURIComponent(email)}`;
      return sendTemplatedEmail(email, "trial-invitation", {
        commune_name: commune.name,
        access_code: commune.trial_access_code!,
        signup_url: signupUrl,
      });
    }),
  );

  return summarizeInvitationResults(results);
}

function summarizeInvitationResults(
  results: PromiseSettledResult<{ success: boolean; error?: string }>[],
): TrialActionResult & { sentCount?: number } {
  const sentCount = results.filter(
    (r) => r.status === "fulfilled" && r.value.success,
  ).length;

  const failedResults = results.filter(
    (r) =>
      r.status === "rejected" ||
      (r.status === "fulfilled" && !r.value.success),
  );

  if (failedResults.length > 0 && sentCount === 0) {
    const firstError = failedResults[0];
    const detail =
      firstError?.status === "rejected"
        ? String(firstError.reason)
        : firstError?.status === "fulfilled"
          ? firstError.value.error
          : undefined;

    console.error("[trial-invitation] All emails failed. First error:", detail);

    const userMessage = detail?.includes("not found")
      ? "Le template d'email est introuvable en base de données. Vérifiez que la migration a été appliquée."
      : detail === "SMTP not configured"
        ? "SMTP non configuré. Vérifiez que SMTP_HOST, SMTP_USER et SMTP_PASS sont définis."
        : `Aucun email n'a pu être envoyé (${detail ?? "erreur inconnue"}). Vérifiez la configuration SMTP.`;

    return { success: false, error: userMessage };
  }

  return { success: true, sentCount };
}
