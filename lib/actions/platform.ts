"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";
import { createPilotCommuneSchema } from "@/lib/validations/schemas";
import type { SubscriptionStatus } from "@/lib/types";

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
    subscriptionStatus: String(formData.get("subscriptionStatus") ?? "inactive").trim(),
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
      subscription_status: data.subscriptionStatus,
      settings: { address: data.mairieAddress },
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

export async function setCommuneSubscription(
  communeId: string,
  status: SubscriptionStatus,
): Promise<PlatformActionResult> {
  await requirePlatformAdmin();

  const supabase = await createClient();
  const { error } = await supabase
    .from("communes")
    .update({ subscription_status: status })
    .eq("id", communeId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(ROUTES.backoffice.communes);
  revalidatePath(ROUTES.backoffice.communeDetail(communeId));
  return { success: true };
}

export async function applyCommuneSubscription(formData: FormData): Promise<void> {
  const communeId = String(formData.get("communeId") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "").trim();

  const allowed: SubscriptionStatus[] = ["inactive", "trial", "active"];
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

  revalidatePath(ROUTES.backoffice.communeDetail(communeId));
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
