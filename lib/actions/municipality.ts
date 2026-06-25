"use server";

import { revalidatePath } from "next/cache";
import {
  requireCommuneStaff,
  requirePlatformAdmin,
} from "@/lib/auth/session";
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

async function requireReportResolverAuth(): Promise<void> {
  try {
    await requireCommuneStaff();
  } catch {
    await requirePlatformAdmin();
  }
}

export async function setReportReviewed(reportId: string): Promise<void> {
  await requireReportResolverAuth();
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
  revalidatePath(ROUTES.backoffice.signalements);
}

export async function resolvePendingReportsForContent(
  contextType: "announcement" | "initiative" | "event" | "user",
  contextId: string,
  communeId: string,
  resolution: "content_suspended" | "user_suspended" | "dismissed",
): Promise<void> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("reports")
    .update({
      status: "reviewed",
      reviewed_at: now,
      resolution,
    })
    .eq("context_type", contextType)
    .eq("context_id", contextId)
    .eq("commune_id", communeId)
    .eq("status", "pending");

  if (error) {
    console.error(
      "[reports] Failed to resolve pending reports for content:",
      error.message,
      error.code,
    );
    return;
  }

  revalidatePath(ROUTES.mairie.signalements);
  revalidatePath(ROUTES.backoffice.signalements);
}

export async function resolvePendingReportsForUser(
  membershipId: string,
  userId: string,
  communeId: string,
): Promise<void> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const [{ data: annIds }, { data: iniIds }, { data: evtIds }] =
    await Promise.all([
      supabase
        .from("announcements")
        .select("id")
        .eq("author_membership_id", membershipId),
      supabase
        .from("initiatives")
        .select("id")
        .eq("author_membership_id", membershipId),
      supabase
        .from("events")
        .select("id")
        .eq("author_membership_id", membershipId),
    ]);

  const authorContentIds = [
    ...(annIds ?? []),
    ...(iniIds ?? []),
    ...(evtIds ?? []),
  ].map((row) => row.id);

  const targetContextIds = [userId, ...authorContentIds];

  const { error } = await supabase
    .from("reports")
    .update({
      status: "reviewed",
      reviewed_at: now,
      resolution: "user_suspended",
    })
    .eq("commune_id", communeId)
    .eq("status", "pending")
    .in("context_id", targetContextIds);

  if (error) {
    console.error(
      "[reports] Failed to cascade-resolve reports for suspended user:",
      error.message,
      error.code,
    );
    return;
  }

  revalidatePath(ROUTES.mairie.signalements);
  revalidatePath(ROUTES.backoffice.signalements);
}

export async function resolveReportAction(
  reportId: string,
  resolution: "content_suspended" | "user_suspended" | "dismissed",
): Promise<void> {
  await requireReportResolverAuth();
  const supabase = await createClient();

  const { error } = await supabase
    .from("reports")
    .update({
      status: "reviewed",
      reviewed_at: new Date().toISOString(),
      resolution,
    })
    .eq("id", reportId);

  if (error) return;
  revalidatePath(ROUTES.mairie.signalements);
  revalidatePath(ROUTES.backoffice.signalements);
}

export async function markReportHandledForm(formData: FormData): Promise<void> {
  const reportId = formData.get("reportId");
  if (typeof reportId !== "string" || !reportId) return;
  await setReportReviewed(reportId);
}
