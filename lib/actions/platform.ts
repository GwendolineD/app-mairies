"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { USER_ROLES } from "@/lib/constants/roles";
import {
  COMMUNE_PLAN_DEFAULT_CENTS,
  MEMBERSHIP_STATUS,
  SUBSCRIPTION_STATUS,
} from "@/lib/constants/statuses";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { parseEurosToCents } from "@/lib/utils/money";
import {
  communeAdminSchema,
  createPilotCommuneSchema,
  paymentAdminSchema,
} from "@/lib/validations/schemas";
import type { AccessStatus, SubscriptionStatus } from "@/lib/types";

export type PlatformActionResult =
  | { success: true }
  | { success: false; error: string };

export type CreatePilotCommuneResult =
  | { success: true; communeId: string }
  | { success: false; error: string; existingCommuneId?: string };

type ActionResult = { error?: string; success?: boolean };

async function requirePlatformAdmin() {
  return requireRole([USER_ROLES.platformAdmin]);
}

function revalidateClients(communeId?: string) {
  revalidatePath(ROUTES.platform.clients);
  revalidatePath(ROUTES.platform.admin);
  revalidatePath(ROUTES.platform.stats);
  revalidatePath(ROUTES.backoffice.communes);
  revalidatePath(ROUTES.backoffice.admin);
  if (communeId) {
    revalidatePath(ROUTES.platform.clientDetail(communeId));
    revalidatePath(ROUTES.backoffice.communeDetail(communeId));
  }
}

function readCommuneForm(formData: FormData) {
  const raw = {
    name: String(formData.get("name") ?? "").trim(),
    inseeCode: String(formData.get("inseeCode") ?? "").trim(),
    postcode: String(formData.get("postcode") ?? "").trim(),
    department: String(formData.get("department") ?? "").trim(),
    plan: String(formData.get("plan") ?? "free").trim(),
    subscriptionStatus: String(
      formData.get("subscriptionStatus") ?? "trial",
    ).trim(),
    billingEmail: String(formData.get("billingEmail") ?? "").trim(),
  };
  const monthlyAmountRaw = String(formData.get("monthlyAmount") ?? "").trim();
  return { raw, monthlyAmountRaw };
}

// =============================================================================
// Pilot commune creation (new backoffice flow)
// =============================================================================

type GeoCommune = {
  code: string;
  nom: string;
  codesPostaux: string[];
  codeDepartement: string;
  centre: { coordinates: [number, number] };
};

async function fetchGeoCommune(inseeCode: string): Promise<GeoCommune | null> {
  const res = await fetch(
    `https://geo.api.gouv.fr/communes/${encodeURIComponent(inseeCode)}?fields=code,nom,codesPostaux,codeDepartement,centre&format=json&geometry=centre`,
    { next: { revalidate: 86400 } },
  );
  if (!res.ok) return null;
  return res.json() as Promise<GeoCommune>;
}

export async function createPilotCommuneAction(
  formData: FormData,
): Promise<CreatePilotCommuneResult> {
  await requirePlatformAdmin();

  const parsed = createPilotCommuneSchema.safeParse({
    inseeCode: String(formData.get("inseeCode") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    postcode: String(formData.get("postcode") ?? "").trim(),
    centroidLat: Number(formData.get("centroidLat")),
    centroidLng: Number(formData.get("centroidLng")),
    accessStatus: String(formData.get("accessStatus") ?? "inactive").trim(),
    mairieAddress: String(formData.get("mairieAddress") ?? "").trim(),
  });

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? "Paramètres invalides.";
    return { success: false, error: firstIssue };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const { data: existing, error: existingError } = await supabase
    .from("communes")
    .select("id")
    .eq("insee_code", data.inseeCode)
    .maybeSingle();

  if (existingError) {
    return { success: false, error: existingError.message };
  }

  if (existing) {
    return {
      success: false,
      error: "Cette commune existe déjà dans le backoffice.",
      existingCommuneId: existing.id,
    };
  }

  const geo = await fetchGeoCommune(data.inseeCode);
  const department = geo?.codeDepartement ?? null;
  const postcode = data.postcode ?? geo?.codesPostaux[0] ?? null;
  const name = geo?.nom ?? data.name;
  const centroidLng = geo?.centre.coordinates[0] ?? data.centroidLng;
  const centroidLat = geo?.centre.coordinates[1] ?? data.centroidLat;

  const { data: inserted, error } = await supabase
    .from("communes")
    .insert({
      insee_code: data.inseeCode,
      name,
      postcode,
      department,
      centroid_lat: centroidLat,
      centroid_lng: centroidLng,
      access_status: data.accessStatus,
      settings: { address: data.mairieAddress },
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { success: false, error: error?.message ?? "Création impossible." };
  }

  revalidateClients(inserted.id);
  return { success: true, communeId: inserted.id };
}

// =============================================================================
// Communes (clients) — legacy admin flow
// =============================================================================

export async function createCommune(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireRole([USER_ROLES.platformAdmin]);

  const { raw, monthlyAmountRaw } = readCommuneForm(formData);
  const parsed = communeAdminSchema.safeParse(raw);
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)
      .flat()
      .filter(Boolean)[0];
    return { error: first ?? "Formulaire invalide." };
  }

  const monthlyAmountCents =
    monthlyAmountRaw === ""
      ? COMMUNE_PLAN_DEFAULT_CENTS[parsed.data.plan] ?? 0
      : parseEurosToCents(monthlyAmountRaw) ?? 0;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("communes")
    .insert({
      name: parsed.data.name,
      insee_code: parsed.data.inseeCode,
      postcode: parsed.data.postcode || null,
      department: parsed.data.department || null,
      plan: parsed.data.plan,
      subscription_status: parsed.data.subscriptionStatus,
      monthly_amount_cents: monthlyAmountCents,
      billing_email: parsed.data.billingEmail || null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "Une commune avec ce code INSEE existe déjà." };
    }
    return { error: "Création impossible. Réessayez dans un instant." };
  }

  revalidateClients(data.id);
  redirect(ROUTES.platform.clientDetail(data.id));
}

export async function updateCommune(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireRole([USER_ROLES.platformAdmin]);

  const communeId = String(formData.get("communeId") ?? "").trim();
  if (!communeId) return { error: "Commune introuvable." };

  const { raw, monthlyAmountRaw } = readCommuneForm(formData);
  const parsed = communeAdminSchema.safeParse(raw);
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)
      .flat()
      .filter(Boolean)[0];
    return { error: first ?? "Formulaire invalide." };
  }

  const monthlyAmountCents =
    monthlyAmountRaw === "" ? 0 : parseEurosToCents(monthlyAmountRaw) ?? 0;

  const supabase = await createClient();
  const { error } = await supabase
    .from("communes")
    .update({
      name: parsed.data.name,
      insee_code: parsed.data.inseeCode,
      postcode: parsed.data.postcode || null,
      department: parsed.data.department || null,
      plan: parsed.data.plan,
      subscription_status: parsed.data.subscriptionStatus,
      monthly_amount_cents: monthlyAmountCents,
      billing_email: parsed.data.billingEmail || null,
    })
    .eq("id", communeId);

  if (error) {
    if (error.code === "23505") {
      return { error: "Une commune avec ce code INSEE existe déjà." };
    }
    return { error: "Mise à jour impossible. Réessayez dans un instant." };
  }

  revalidateClients(communeId);
  return { success: true };
}

export async function setCommuneAccessStatus(
  communeId: string,
  status: AccessStatus,
): Promise<PlatformActionResult> {
  await requirePlatformAdmin();

  const supabase = await createClient();
  const { error } = await supabase
    .from("communes")
    .update({ access_status: status })
    .eq("id", communeId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateClients(communeId);
  return { success: true };
}

export async function applyCommuneAccessStatus(formData: FormData): Promise<void> {
  const communeId = String(formData.get("communeId") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "").trim();

  const allowed: AccessStatus[] = ["inactive", "trial", "active"];
  if (!communeId || !allowed.includes(statusRaw as AccessStatus)) return;

  await setCommuneAccessStatus(communeId, statusRaw as AccessStatus);
}

export async function setCommuneSubscription(
  communeId: string,
  status: SubscriptionStatus,
): Promise<void> {
  await requireRole([USER_ROLES.platformAdmin]);

  const supabase = await createClient();
  const patch: Record<string, unknown> = { subscription_status: status };
  if (status === SUBSCRIPTION_STATUS.suspended) {
    patch.suspended_at = new Date().toISOString();
  } else {
    patch.suspended_at = null;
    patch.suspension_reason = null;
  }

  const { error } = await supabase
    .from("communes")
    .update(patch)
    .eq("id", communeId);

  if (error) return;
  revalidateClients(communeId);
}

export async function applyCommuneSubscription(
  formData: FormData,
): Promise<void> {
  const communeId = String(formData.get("communeId") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "").trim();

  const allowed: SubscriptionStatus[] = [
    "inactive",
    "trial",
    "active",
    "suspended",
  ];
  if (!communeId || !allowed.includes(statusRaw as SubscriptionStatus)) return;

  await setCommuneSubscription(communeId, statusRaw as SubscriptionStatus);
}

export async function updateCommuneWelcomeMessageAsAdmin(
  communeId: string,
  welcomeMessage: string,
): Promise<PlatformActionResult> {
  await requirePlatformAdmin();

  if (!communeId) {
    return { success: false, error: "Commune introuvable." };
  }

  const supabase = await createClient();
  const { data: commune, error: fetchError } = await supabase
    .from("communes")
    .select("settings")
    .eq("id", communeId)
    .maybeSingle();

  if (fetchError || !commune) {
    return { success: false, error: "Commune introuvable." };
  }

  const nextSettings = {
    ...(commune.settings as Record<string, unknown>),
    welcomeMessage: welcomeMessage.trim(),
  };

  const { error } = await supabase
    .from("communes")
    .update({ settings: nextSettings })
    .eq("id", communeId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateClients(communeId);
  return { success: true };
}

export async function suspendCommune(formData: FormData): Promise<void> {
  await requireRole([USER_ROLES.platformAdmin]);
  const communeId = String(formData.get("communeId") ?? "").trim();
  if (!communeId) return;
  const reason = String(formData.get("reason") ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("communes")
    .update({
      subscription_status: SUBSCRIPTION_STATUS.suspended,
      suspended_at: new Date().toISOString(),
      suspension_reason: reason,
    })
    .eq("id", communeId);

  if (error) return;
  revalidateClients(communeId);
}

export async function reactivateCommune(formData: FormData): Promise<void> {
  await requireRole([USER_ROLES.platformAdmin]);
  const communeId = String(formData.get("communeId") ?? "").trim();
  if (!communeId) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("communes")
    .update({
      subscription_status: SUBSCRIPTION_STATUS.active,
      suspended_at: null,
      suspension_reason: null,
    })
    .eq("id", communeId);

  if (error) return;
  revalidateClients(communeId);
}

export async function deleteCommune(formData: FormData): Promise<void> {
  await requireRole([USER_ROLES.platformAdmin]);
  const communeId = String(formData.get("communeId") ?? "").trim();
  if (!communeId) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("communes")
    .delete()
    .eq("id", communeId);

  if (error) return;
  revalidateClients();
  redirect(ROUTES.platform.clients);
}

// =============================================================================
// Users (per client)
// =============================================================================

export async function suspendCommuneUser(formData: FormData): Promise<void> {
  await requireRole([USER_ROLES.platformAdmin]);
  const membershipId = String(formData.get("membershipId") ?? "").trim();
  const communeId = String(formData.get("communeId") ?? "").trim();
  if (!membershipId) return;
  const reason = String(formData.get("reason") ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("memberships")
    .update({
      status: MEMBERSHIP_STATUS.suspended,
      suspended_at: new Date().toISOString(),
      suspension_reason: reason,
    })
    .eq("id", membershipId);

  if (error) return;
  revalidateClients(communeId);
}

export async function reactivateCommuneUser(formData: FormData): Promise<void> {
  await requireRole([USER_ROLES.platformAdmin]);
  const membershipId = String(formData.get("membershipId") ?? "").trim();
  const communeId = String(formData.get("communeId") ?? "").trim();
  if (!membershipId) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("memberships")
    .update({
      status: MEMBERSHIP_STATUS.active,
      suspended_at: null,
      suspension_reason: null,
    })
    .eq("id", membershipId);

  if (error) return;
  revalidateClients(communeId);
}

export async function deleteCommuneUser(formData: FormData): Promise<void> {
  const ctx = await requireRole([USER_ROLES.platformAdmin]);
  const userId = String(formData.get("userId") ?? "").trim();
  const communeId = String(formData.get("communeId") ?? "").trim();
  if (!userId) return;
  if (userId === ctx.userId) return;

  const admin = await createServiceClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return;

  revalidateClients(communeId);
}

// =============================================================================
// Payments (revenue)
// =============================================================================

export async function recordPayment(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireRole([USER_ROLES.platformAdmin]);
  const communeId = String(formData.get("communeId") ?? "").trim();
  if (!communeId) return { error: "Commune introuvable." };

  const amountCents = parseEurosToCents(
    String(formData.get("amount") ?? "").trim(),
  );
  if (amountCents === null) {
    return { error: "Montant invalide." };
  }

  const parsed = paymentAdminSchema.safeParse({
    status: String(formData.get("status") ?? "paid"),
    periodStart: String(formData.get("periodStart") ?? ""),
    periodEnd: String(formData.get("periodEnd") ?? ""),
    note: String(formData.get("note") ?? ""),
  });
  if (!parsed.success) return { error: "Formulaire de paiement invalide." };

  const supabase = await createClient();
  const { error } = await supabase.from("commune_payments").insert({
    commune_id: communeId,
    amount_cents: amountCents,
    status: parsed.data.status,
    period_start: parsed.data.periodStart || null,
    period_end: parsed.data.periodEnd || null,
    paid_at:
      parsed.data.status === "paid" ? new Date().toISOString() : null,
    note: parsed.data.note || null,
  });

  if (error) return { error: "Enregistrement du paiement impossible." };

  revalidateClients(communeId);
  return { success: true };
}

export async function deletePayment(formData: FormData): Promise<void> {
  await requireRole([USER_ROLES.platformAdmin]);
  const paymentId = String(formData.get("paymentId") ?? "").trim();
  const communeId = String(formData.get("communeId") ?? "").trim();
  if (!paymentId) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("commune_payments")
    .delete()
    .eq("id", paymentId);

  if (error) return;
  revalidateClients(communeId);
}

export async function softDeleteAnnouncementByAdmin(id: string) {
  await requireRole([USER_ROLES.platformAdmin]);

  const supabase = await createClient();
  const { error } = await supabase.from("announcements").delete().eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(ROUTES.backoffice.admin);
  return { success: true };
}

// =============================================================================
// Subscription periods (new backoffice flow)
// =============================================================================

export async function createCommuneSubscriptionPeriod(
  communeId: string,
  data: { startsAt: string; endsAt: string; amountCents: number },
): Promise<PlatformActionResult> {
  await requirePlatformAdmin();

  if (!communeId || !data.startsAt || !data.endsAt || data.amountCents < 0) {
    return { success: false, error: "Paramètres invalides." };
  }

  const supabase = await createClient();

  const { data: overlap } = await supabase
    .from("commune_subscriptions")
    .select("id")
    .eq("commune_id", communeId)
    .lte("starts_at", data.endsAt)
    .gte("ends_at", data.startsAt)
    .limit(1);

  if (overlap?.length) {
    return { success: false, error: "Les dates chevauchent une période existante." };
  }

  const { error } = await supabase.from("commune_subscriptions").insert({
    commune_id: communeId,
    starts_at: data.startsAt,
    ends_at: data.endsAt,
    amount_cents: data.amountCents,
    payment_status: "unpaid",
    auto_renew: true,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const { data: commune } = await supabase
    .from("communes")
    .select("subscribed_since")
    .eq("id", communeId)
    .single();

  if (!commune?.subscribed_since || data.startsAt < commune.subscribed_since) {
    await supabase
      .from("communes")
      .update({ subscribed_since: data.startsAt })
      .eq("id", communeId);
  }

  revalidateClients(communeId);
  return { success: true };
}

export async function markSubscriptionPaid(
  subscriptionId: string,
  paidAt: string,
  paymentMethod: string,
): Promise<PlatformActionResult> {
  await requirePlatformAdmin();

  if (!paidAt || !paymentMethod.trim()) {
    return { success: false, error: "Date et moyen de paiement requis." };
  }

  const supabase = await createClient();
  const { data: subscription, error: fetchError } = await supabase
    .from("commune_subscriptions")
    .select("commune_id")
    .eq("id", subscriptionId)
    .single();

  if (fetchError || !subscription) {
    return { success: false, error: "Abonnement introuvable." };
  }

  const { error } = await supabase
    .from("commune_subscriptions")
    .update({
      payment_status: "paid",
      paid_at: paidAt,
      payment_method: paymentMethod.trim(),
    })
    .eq("id", subscriptionId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateClients(subscription.commune_id);
  return { success: true };
}

export async function deleteSubscriptionPeriod(
  subscriptionId: string,
): Promise<PlatformActionResult> {
  await requirePlatformAdmin();

  const supabase = await createClient();
  const { data: subscription, error: fetchError } = await supabase
    .from("commune_subscriptions")
    .select("commune_id")
    .eq("id", subscriptionId)
    .single();

  if (fetchError || !subscription) {
    return { success: false, error: "Abonnement introuvable." };
  }

  const { error } = await supabase
    .from("commune_subscriptions")
    .delete()
    .eq("id", subscriptionId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateClients(subscription.commune_id);
  return { success: true };
}

export async function updateCommuneSubscribedSince(
  communeId: string,
  subscribedSince: string | null,
): Promise<PlatformActionResult> {
  await requirePlatformAdmin();

  const supabase = await createClient();
  const { error } = await supabase
    .from("communes")
    .update({ subscribed_since: subscribedSince })
    .eq("id", communeId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateClients(communeId);
  return { success: true };
}

export async function updateEmailTemplate(
  slug: string,
  data: { subject: string; bodyHtml: string },
): Promise<PlatformActionResult> {
  await requirePlatformAdmin();

  if (!slug || !data.subject.trim() || !data.bodyHtml.trim()) {
    return { success: false, error: "Sujet et contenu HTML requis." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("email_templates")
    .update({
      subject: data.subject.trim(),
      body_html: data.bodyHtml.trim(),
    })
    .eq("slug", slug);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(ROUTES.backoffice.emails);
  return { success: true };
}
