"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";
import { sanitizeHtml } from "@/lib/utils/sanitize-html";
import { createPilotCommuneSchema, updateCommuneInfoSchema } from "@/lib/validations/schemas";
import type { AccessStatus } from "@/lib/types";

export type PlatformActionResult =
  | { success: true }
  | { success: false; error: string };

export type CreatePilotCommuneResult =
  | { success: true; communeId: string }
  | { success: false; error: string; existingCommuneId?: string };

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
    mairieAddressStreet: String(formData.get("mairieAddressStreet") ?? "").trim() || undefined,
    mairieAddressCity: String(formData.get("mairieAddressCity") ?? "").trim() || undefined,
    mairieAddressPostcode: String(formData.get("mairieAddressPostcode") ?? "").trim() || undefined,
    mairieAddressLat: formData.get("mairieAddressLat")
      ? Number(formData.get("mairieAddressLat"))
      : undefined,
    mairieAddressLng: formData.get("mairieAddressLng")
      ? Number(formData.get("mairieAddressLng"))
      : undefined,
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

  const mairieStreet =
    data.mairieAddressStreet?.trim() || data.mairieAddress.trim();
  const mairieCity = data.mairieAddressCity?.trim() || name;
  const mairiePostcode =
    data.mairieAddressPostcode?.trim() || postcode || null;
  const mairieLat = data.mairieAddressLat ?? centroidLat;
  const mairieLng = data.mairieAddressLng ?? centroidLng;

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
      mairie_address_street: mairieStreet,
      mairie_address_city: mairieCity,
      mairie_address_postcode: mairiePostcode,
      mairie_address_lat: mairieLat,
      mairie_address_lng: mairieLng,
      settings: { address: mairieStreet },
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { success: false, error: error?.message ?? "Création impossible." };
  }

  revalidatePath(ROUTES.backoffice.communes);
  revalidatePath(ROUTES.backoffice.communeDetail(inserted.id));

  return { success: true, communeId: inserted.id };
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

  revalidatePath(ROUTES.backoffice.communes);
  revalidatePath(ROUTES.backoffice.communeDetail(communeId));
  return { success: true };
}

export async function applyCommuneAccessStatus(formData: FormData): Promise<void> {
  const communeId = String(formData.get("communeId") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "").trim();

  const allowed: AccessStatus[] = ["inactive", "trial", "active"];
  if (!communeId || !allowed.includes(statusRaw as AccessStatus)) return;

  await setCommuneAccessStatus(communeId, statusRaw as AccessStatus);
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

  revalidatePath(ROUTES.backoffice.communeDetail(communeId));
  return { success: true };
}

export async function updateCommuneInfo(
  communeId: string,
  input: {
    name: string;
    postcode: string;
    mairieAddressStreet: string;
    mairieAddressCity?: string;
    mairieAddressPostcode?: string;
    mairieAddressLat?: number;
    mairieAddressLng?: number;
  },
): Promise<PlatformActionResult> {
  await requirePlatformAdmin();

  if (!communeId) {
    return { success: false, error: "Commune introuvable." };
  }

  const parsed = updateCommuneInfoSchema.safeParse(input);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? "Paramètres invalides.";
    return { success: false, error: firstIssue };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const { data: commune, error: fetchError } = await supabase
    .from("communes")
    .select("settings")
    .eq("id", communeId)
    .maybeSingle();

  if (fetchError || !commune) {
    return { success: false, error: "Commune introuvable." };
  }

  const mairieStreet = data.mairieAddressStreet.trim();
  const mairieCity = data.mairieAddressCity?.trim() || data.name.trim();
  const mairiePostcode =
    data.mairieAddressPostcode?.trim() || data.postcode.trim();

  const nextSettings = {
    ...(commune.settings as Record<string, unknown>),
    address: mairieStreet,
  };

  const { error } = await supabase
    .from("communes")
    .update({
      name: data.name.trim(),
      postcode: data.postcode.trim(),
      mairie_address_street: mairieStreet,
      mairie_address_city: mairieCity,
      mairie_address_postcode: mairiePostcode,
      mairie_address_lat: data.mairieAddressLat ?? null,
      mairie_address_lng: data.mairieAddressLng ?? null,
      settings: nextSettings,
    })
    .eq("id", communeId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(ROUTES.backoffice.communes);
  revalidatePath(ROUTES.backoffice.communeDetail(communeId));
  revalidatePath(ROUTES.mairie.evenements);
  return { success: true };
}

export async function softDeleteAnnouncementByAdmin(id: string) {
  await requirePlatformAdmin();

  const supabase = await createClient();
  const { error } = await supabase
    .from("announcements")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(ROUTES.backoffice.admin);
  return { success: true };
}

export async function createCommuneSubscriptionPeriod(
  communeId: string,
  data: { startsAt: string; endsAt: string; amountCents: number },
): Promise<PlatformActionResult> {
  await requirePlatformAdmin();

  if (!communeId || !data.startsAt || !data.endsAt || data.amountCents < 0) {
    return { success: false, error: "Paramètres invalides." };
  }

  const supabase = await createClient();

  // Validate no overlap with existing periods
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

  // Auto-update subscribed_since if new period starts earlier or if null
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

  revalidatePath(ROUTES.backoffice.communeDetail(communeId));
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

  revalidatePath(ROUTES.backoffice.communeDetail(subscription.commune_id));
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

  revalidatePath(ROUTES.backoffice.communeDetail(subscription.commune_id));
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

  revalidatePath(ROUTES.backoffice.communeDetail(communeId));
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

  const sanitizedHtml = sanitizeHtml(data.bodyHtml);
  if (!sanitizedHtml.trim()) {
    return { success: false, error: "Sujet et contenu HTML requis." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("email_templates")
    .update({
      subject: data.subject.trim(),
      body_html: sanitizedHtml,
    })
    .eq("slug", slug);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(ROUTES.backoffice.emails);
  return { success: true };
}
