"use server";

import { revalidatePath } from "next/cache";
import { requireActiveMembership } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendTemplatedEmail } from "@/lib/email";
import { getAppUrl } from "@/lib/utils/app-url";
import { formatShortDate } from "@/lib/utils/format-date";
import { reportSchema, userReportSchema } from "@/lib/validations/schemas";

export type ContentReportActionState = {
  error?: string;
  success?: boolean;
} | undefined;

const CONTEXT_TYPE_LABELS: Record<string, string> = {
  announcement: "Annonce",
  initiative: "Initiative",
  event: "Événement",
};

export async function submitContentReport(
  _state: ContentReportActionState,
  formData: FormData,
): Promise<ContentReportActionState> {
  const ctx = await requireActiveMembership();

  const raw = {
    contextType: formData.get("contextType") as string,
    contextId: formData.get("contextId") as string,
    reason: formData.get("reason") as string,
  };
  const parsed = reportSchema.safeParse(raw);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message;
    return { error: firstIssue ?? "Vérifiez le motif du signalement." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("reports").insert({
    reporter_membership_id: ctx.activeMembership!.id,
    context_type: parsed.data.contextType,
    context_id: parsed.data.contextId,
    reason: parsed.data.reason,
  });

  if (error) {
    console.error("[reports] Failed to insert report:", error.message, error.code);
    return { error: "Impossible d'envoyer le signalement. Réessayez plus tard." };
  }

  // Send notification emails (best-effort, non-blocking)
  sendReportNotificationEmails(
    ctx.activeMembership!.commune_id,
    parsed.data.contextType,
    parsed.data.contextId,
    parsed.data.reason,
    ctx.profile.display_name ?? ctx.profile.first_name ?? "Un·e résident·e",
  ).catch((err) => {
    console.error("[reports] Failed to send notification emails:", err);
  });

  revalidatePath("/", "layout");
  return { success: true };
}

export async function submitUserReport(formData: FormData): Promise<void> {
  const ctx = await requireActiveMembership();

  const raw = {
    reportedUserId: formData.get("reportedUserId") as string,
    reason: formData.get("reason") as string,
  };
  const parsed = userReportSchema.safeParse(raw);
  if (!parsed.success) return;

  if (parsed.data.reportedUserId === ctx.userId) return;

  const supabase = await createClient();
  const { error } = await supabase.from("reports").insert({
    reporter_membership_id: ctx.activeMembership!.id,
    context_type: "user",
    context_id: parsed.data.reportedUserId,
    reason: parsed.data.reason,
  });

  if (error) return;
  revalidatePath(ROUTES.mairie.signalements);
  revalidatePath(ROUTES.backoffice.admin);
}

async function sendReportNotificationEmails(
  communeId: string,
  contextType: string,
  contextId: string,
  reason: string,
  reporterName: string,
): Promise<void> {
  const serviceClient = await createServiceClient();
  const appUrl = getAppUrl();

  // Fetch content title
  const table =
    contextType === "announcement"
      ? "announcements"
      : contextType === "initiative"
        ? "initiatives"
        : "events";
  const { data: content } = await serviceClient
    .from(table)
    .select("title")
    .eq("id", contextId)
    .maybeSingle();

  const contentTitle = content?.title ?? "Contenu signalé";
  const contentTypeLabel = CONTEXT_TYPE_LABELS[contextType] ?? contextType;
  const reportDate = formatShortDate(new Date().toISOString());

  // Fetch commune name
  const { data: commune } = await serviceClient
    .from("communes")
    .select("name")
    .eq("id", communeId)
    .single();
  const communeName = commune?.name ?? "Commune";

  // Send to staff/mayor of the commune
  const { data: staffMemberships } = await serviceClient
    .from("memberships")
    .select("user_id")
    .eq("commune_id", communeId)
    .eq("status", "active")
    .in("role", ["staff", "mayor"]);

  if (staffMemberships?.length) {
    const staffUserIds = staffMemberships.map((m) => m.user_id);
    const { data: authData } = await serviceClient.auth.admin.listUsers();
    const staffEmails = (authData?.users ?? [])
      .filter((u) => staffUserIds.includes(u.id) && u.email)
      .map((u) => u.email!);

    for (const email of staffEmails) {
      sendTemplatedEmail(email, "report-notification-staff", {
        commune_name: communeName,
        content_type: contentTypeLabel,
        content_title: contentTitle,
        reporter_name: reporterName,
        reason,
        report_date: reportDate,
        moderation_url: `${appUrl}${ROUTES.mairie.signalements}`,
      }).catch(() => {});
    }
  }

  // Send to platform admins
  const { data: adminProfiles } = await serviceClient
    .from("profiles")
    .select("user_id")
    .eq("is_platform_admin", true);

  if (adminProfiles?.length) {
    const adminUserIds = adminProfiles.map((p) => p.user_id);
    const { data: authData } = await serviceClient.auth.admin.listUsers();
    const adminEmails = (authData?.users ?? [])
      .filter((u) => adminUserIds.includes(u.id) && u.email)
      .map((u) => u.email!);

    for (const email of adminEmails) {
      sendTemplatedEmail(email, "report-notification-admin", {
        commune_name: communeName,
        content_type: contentTypeLabel,
        content_title: contentTitle,
        reporter_name: reporterName,
        reason,
        report_date: reportDate,
        moderation_url: `${appUrl}${ROUTES.backoffice.signalements}`,
      }).catch(() => {});
    }
  }
}
