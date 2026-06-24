"use server";

import { revalidatePath } from "next/cache";
import { requireActiveMembership, requirePlatformAdmin } from "@/lib/auth/session";
import {
  SUPPORT_REQUEST_RATE_LIMIT,
  SUPPORT_REQUEST_RATE_WINDOW_MS,
} from "@/lib/constants/support-request";
import { ROUTES } from "@/lib/constants/routes";
import { sendSupportRequestNotification } from "@/lib/email/support-request-notification";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { SupportRequestStatus } from "@/lib/types";
import { supportRequestSchema } from "@/lib/validations/schemas";

export type SupportRequestActionState = {
  error?: string;
  success?: boolean;
} | undefined;

export async function submitSupportRequest(
  _state: SupportRequestActionState,
  formData: FormData,
): Promise<SupportRequestActionState> {
  const ctx = await requireActiveMembership();

  const parsed = supportRequestSchema.safeParse({
    subject: formData.get("subject"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message;
    return { error: firstIssue ?? "Vérifiez les champs du formulaire." };
  }

  const supabase = await createClient();
  const rateLimitSince = new Date(Date.now() - SUPPORT_REQUEST_RATE_WINDOW_MS).toISOString();
  const serviceClient = await createServiceClient();

  const { count, error: countError } = await serviceClient
    .from("support_requests")
    .select("id", { count: "exact", head: true })
    .eq("user_id", ctx.userId)
    .gte("created_at", rateLimitSince);

  if (countError) {
    console.error(
      "[support-requests] Rate limit check failed:",
      countError.message,
      countError.code,
      countError.details,
    );
    return { error: "Impossible d'envoyer votre message pour le moment. Réessayez plus tard." };
  }

  if ((count ?? 0) >= SUPPORT_REQUEST_RATE_LIMIT) {
    return {
      error: "Vous avez envoyé plusieurs messages récemment. Réessayez dans une heure.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: "Impossible de récupérer votre adresse e-mail." };
  }

  const membership = ctx.activeMembership;
  const communeName = membership?.commune?.name ?? "Commune inconnue";

  const { data: inserted, error: insertError } = await supabase
    .from("support_requests")
    .insert({
      user_id: ctx.userId,
      membership_id: membership?.id ?? null,
      commune_id: membership?.commune_id ?? ctx.activeCommuneId,
      user_email: user.email,
      first_name: ctx.profile.first_name,
      last_name: ctx.profile.last_name,
      subject: parsed.data.subject,
      message: parsed.data.message,
    })
    .select("id, created_at")
    .single();

  if (insertError || !inserted) {
    console.error("[support-requests] Insert failed:", insertError?.message);
    return { error: "Impossible d'envoyer votre message pour le moment. Réessayez plus tard." };
  }

  sendSupportRequestNotification({
    id: inserted.id,
    subject: parsed.data.subject,
    message: parsed.data.message,
    userEmail: user.email,
    firstName: ctx.profile.first_name,
    lastName: ctx.profile.last_name,
    communeName,
    createdAt: inserted.created_at,
  }).catch((err) => {
    console.error("[support-requests] Failed to send notification email:", err);
  });

  revalidatePath(ROUTES.backoffice.assistance);
  return { success: true };
}

export async function updateSupportRequestStatus(
  requestId: string,
  status: SupportRequestStatus,
  adminComment?: string,
): Promise<{ success: boolean; error?: string }> {
  const ctx = await requirePlatformAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("support_requests")
    .update({
      status,
      admin_comment: adminComment?.trim() || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by_user_id: ctx.userId,
    })
    .eq("id", requestId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(ROUTES.backoffice.assistance);
  return { success: true };
}

export async function markSupportRequestInProgress(
  requestId: string,
): Promise<{ success: boolean; error?: string }> {
  return updateSupportRequestStatus(requestId, "in_progress");
}
