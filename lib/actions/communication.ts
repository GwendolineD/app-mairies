"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";
import { communicationAssetSchema } from "@/lib/validations/schemas";

export type CommunicationAssetFormState = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

function parseCommunicationAssetFormData(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    preview_url: String(formData.get("preview_url") ?? "").trim(),
    file_url: String(formData.get("file_url") ?? "").trim(),
    sort_order: String(formData.get("sort_order") ?? "0"),
    published: formData.get("published") ?? "true",
    commune_id: String(formData.get("commune_id") ?? "").trim(),
  };
}

function validateFormData(formData: FormData) {
  const parsed = communicationAssetSchema.safeParse(parseCommunicationAssetFormData(formData));

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString() ?? "form";
      fieldErrors[field] = issue.message;
    }
    return { ok: false as const, fieldErrors, error: "Données invalides" };
  }

  return { ok: true as const, data: parsed.data };
}

function invalidateCommunicationPaths() {
  revalidatePath(ROUTES.backoffice.communication);
  revalidatePath(ROUTES.mairie.communication);
}

export async function createCommunicationAsset(
  _prev: CommunicationAssetFormState,
  formData: FormData,
): Promise<CommunicationAssetFormState> {
  await requirePlatformAdmin();

  const validation = validateFormData(formData);
  if (!validation.ok) {
    return {
      success: false,
      error: validation.error,
      fieldErrors: validation.fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("communication_assets").insert({
    title: validation.data.title,
    description: validation.data.description,
    preview_url: validation.data.preview_url,
    file_url: validation.data.file_url,
    sort_order: validation.data.sort_order,
    published: validation.data.published,
    commune_id: validation.data.commune_id,
  });

  if (error) {
    console.error("[createCommunicationAsset] DB error:", error);
    return { success: false, error: "Erreur lors de la création" };
  }

  invalidateCommunicationPaths();
  return { success: true };
}

export async function updateCommunicationAsset(
  _prev: CommunicationAssetFormState,
  formData: FormData,
): Promise<CommunicationAssetFormState> {
  await requirePlatformAdmin();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    return { success: false, error: "Identifiant manquant" };
  }

  const validation = validateFormData(formData);
  if (!validation.ok) {
    return {
      success: false,
      error: validation.error,
      fieldErrors: validation.fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("communication_assets")
    .update({
      title: validation.data.title,
      description: validation.data.description,
      preview_url: validation.data.preview_url,
      file_url: validation.data.file_url,
      sort_order: validation.data.sort_order,
      published: validation.data.published,
      commune_id: validation.data.commune_id,
    })
    .eq("id", id);

  if (error) {
    console.error("[updateCommunicationAsset] DB error:", error);
    return { success: false, error: "Erreur lors de la mise à jour" };
  }

  invalidateCommunicationPaths();
  return { success: true };
}

export async function deleteCommunicationAsset(
  _prev: CommunicationAssetFormState,
  formData: FormData,
): Promise<CommunicationAssetFormState> {
  await requirePlatformAdmin();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    return { success: false, error: "Identifiant manquant" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("communication_assets").delete().eq("id", id);

  if (error) {
    console.error("[deleteCommunicationAsset] DB error:", error);
    return { success: false, error: "Erreur lors de la suppression" };
  }

  invalidateCommunicationPaths();
  return { success: true };
}
