"use server";

import { revalidatePath } from "next/cache";
import { requireCommuneStaff } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { sendTemplatedEmail } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";
import { formatShortDate } from "@/lib/utils/format-date";

export type CancellationActionResult =
  | { success: true }
  | { success: false; error: string };

export async function cancelSubscription(
  communeId: string,
  subscriptionId: string,
  comment: string,
): Promise<CancellationActionResult> {
  const ctx = await requireCommuneStaff();

  if (ctx.activeCommuneId !== communeId) {
    return { success: false, error: "Accès non autorisé à cette commune." };
  }

  const trimmedComment = comment.trim();
  if (trimmedComment.length < 10) {
    return {
      success: false,
      error: "Le commentaire doit contenir au moins 10 caractères.",
    };
  }

  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: subscription, error: subscriptionError } = await supabase
    .from("commune_subscriptions")
    .select("id, ends_at")
    .eq("id", subscriptionId)
    .eq("commune_id", communeId)
    .maybeSingle();

  if (subscriptionError || !subscription) {
    return { success: false, error: "Période d'abonnement introuvable." };
  }

  if (subscription.ends_at < today) {
    return {
      success: false,
      error: "Cette période d'abonnement est déjà terminée.",
    };
  }

  const { data: existingCancellation } = await supabase
    .from("cancellation_requests")
    .select("id")
    .eq("subscription_id", subscriptionId)
    .maybeSingle();

  if (existingCancellation) {
    return {
      success: false,
      error: "Cette période est déjà résiliée.",
    };
  }

  const { data: commune } = await supabase
    .from("communes")
    .select("name, postcode")
    .eq("id", communeId)
    .single();

  if (!commune) {
    return { success: false, error: "Commune introuvable." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, display_name")
    .eq("user_id", ctx.userId)
    .single();

  const { data: authUser } = await supabase.auth.getUser();
  const userEmail = authUser.user?.email ?? "";
  const userName =
    profile?.display_name ??
    ([profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
      "Utilisateur");

  const { error: insertError } = await supabase
    .from("cancellation_requests")
    .insert({
      commune_id: communeId,
      subscription_id: subscriptionId,
      requested_by_user_id: ctx.userId,
      comment: trimmedComment,
    });

  if (insertError) {
    console.error("[cancellation] Insert error:", insertError);
    return { success: false, error: "Impossible d'enregistrer la résiliation." };
  }

  await supabase
    .from("commune_subscriptions")
    .update({ auto_renew: false })
    .eq("id", subscriptionId);

  const subscriptionEndDate = formatShortDate(subscription.ends_at);

  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (adminEmail) {
    sendTemplatedEmail(adminEmail, "cancellation-request-admin", {
      commune_name: commune.name,
      commune_postcode: commune.postcode ?? "",
      user_name: userName,
      user_email: userEmail,
      request_date: formatShortDate(new Date().toISOString()),
      comment: trimmedComment,
    }).catch((err) => {
      console.error("[cancellation] Failed to send admin email:", err);
    });
  }

  const { data: staffMemberships } = await supabase
    .from("memberships")
    .select("user_id, profiles!inner(user_id)")
    .eq("commune_id", communeId)
    .eq("status", "active")
    .in("role", ["staff", "mayor"]);

  if (staffMemberships && staffMemberships.length > 0) {
    const staffUserIds = staffMemberships.map((m) => m.user_id);

    const { data: authData } = await supabase.auth.admin.listUsers();
    const staffEmails = (authData?.users ?? [])
      .filter((u) => staffUserIds.includes(u.id) && u.email)
      .map((u) => u.email!);

    if (staffEmails.length > 0) {
      for (const staffEmail of staffEmails) {
        sendTemplatedEmail(staffEmail, "cancellation-confirmation-staff", {
          commune_name: commune.name,
          user_name: userName,
          subscription_end_date: subscriptionEndDate,
          comment: trimmedComment,
        }).catch((err) => {
          console.error("[cancellation] Failed to send staff email:", err);
        });
      }
    }
  }

  revalidatePath(ROUTES.mairie.abonnement);
  revalidatePath(ROUTES.backoffice.communeDetail(communeId));

  return { success: true };
}
