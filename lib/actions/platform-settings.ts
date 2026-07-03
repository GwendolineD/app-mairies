"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import {
  getErrorIllustrationUrls,
  getPlatformSupportEmail as getCachedPlatformSupportEmail,
  PLATFORM_SETTINGS_CACHE_TAG,
} from "@/lib/queries/platform-settings";
import { isCloudinaryDeliveryUrl } from "@/lib/services/cloudinary";
import { createClient } from "@/lib/supabase/server";

const cloudinaryUrlSchema = z
  .string()
  .url("URL invalide.")
  .refine(isCloudinaryDeliveryUrl, {
    message: "URL Cloudinary invalide (domaine attendu : res.cloudinary.com).",
  });

const updatePlatformSettingsSchema = z.object({
  supportEmail: z.string().email("Email invalide."),
  errorIllustrationUrls: z
    .array(cloudinaryUrlSchema)
    .max(20, "Maximum 20 illustrations."),
});

type UpdateInput = z.infer<typeof updatePlatformSettingsSchema>;

function formatPlatformSettingsDbError(message: string, code?: string): string {
  if (
    code === "42501" ||
    message.toLowerCase().includes("permission denied")
  ) {
    return "Vous n'avez pas les droits pour modifier ces réglages.";
  }
  return "Erreur lors de l'enregistrement. Réessayez dans un instant.";
}

export async function updatePlatformSettings(
  input: UpdateInput,
): Promise<{ success: boolean; error?: string; fieldErrors?: Record<string, string> }> {
  await requirePlatformAdmin();

  const parsed = updatePlatformSettingsSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path.join(".") || "form";
      fieldErrors[field] = issue.message;
    }
    return { success: false, error: "Données invalides.", fieldErrors };
  }

  const { supportEmail, errorIllustrationUrls } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("platform_settings")
    .update({
      support_email: supportEmail,
      error_illustration_urls: errorIllustrationUrls,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    return {
      success: false,
      error: formatPlatformSettingsDbError(error.message, error.code),
    };
  }

  updateTag(PLATFORM_SETTINGS_CACHE_TAG);
  revalidatePath(ROUTES.backoffice.settings);
  return { success: true };
}

export async function getPlatformSupportEmail(): Promise<string> {
  return getCachedPlatformSupportEmail();
}

export async function getRandomErrorIllustration(): Promise<string | null> {
  const urls = await getErrorIllustrationUrls();
  const validUrls = urls.filter(isCloudinaryDeliveryUrl);
  if (validUrls.length === 0) return null;
  const index = Math.floor(Math.random() * validUrls.length);
  return validUrls[index] ?? null;
}
