"use server";

import { revalidateTag } from "next/cache";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ANNOUNCEMENT_CATEGORIES_CACHE_TAG } from "@/lib/queries/announcement-categories";
import { ALLOWED_ICON_NAMES } from "@/lib/utils/lucide-icon-map";

const categorySchema = z.object({
  slug: z
    .string()
    .min(2, "Slug requis (min 2 caractères)")
    .max(50, "Slug trop long (max 50 caractères)")
    .regex(/^[a-z0-9-]+$/, "Slug invalide (minuscules, chiffres, tirets)"),
  label: z.string().min(1, "Libellé requis").max(50, "Libellé trop long"),
  icon_name: z.string().nullable(),
  color_hex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Couleur invalide (format #RRGGBB)"),
  sort_order: z.coerce.number().int().min(0).default(0),
  map_pin_url: z.string().url("URL invalide").nullable().or(z.literal("")),
  default_image_url: z.string().url("URL invalide").nullable().or(z.literal("")),
});

export type CategoryFormState = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

function parseFormData(formData: FormData) {
  return {
    slug: formData.get("slug") as string,
    label: formData.get("label") as string,
    icon_name: (formData.get("icon_name") as string) || null,
    color_hex: formData.get("color_hex") as string,
    sort_order: parseInt(formData.get("sort_order") as string, 10) || 0,
    map_pin_url: (formData.get("map_pin_url") as string) || null,
    default_image_url: (formData.get("default_image_url") as string) || null,
  };
}

export async function createAnnouncementCategory(
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requirePlatformAdmin();

  const raw = parseFormData(formData);
  const parsed = categorySchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString() ?? "form";
      fieldErrors[field] = issue.message;
    }
    return { success: false, error: "Données invalides", fieldErrors };
  }

  const { slug, label, icon_name, color_hex, sort_order, map_pin_url, default_image_url } =
    parsed.data;

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("announcement_categories")
    .select("slug")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    return {
      success: false,
      error: "Ce slug existe déjà",
      fieldErrors: { slug: "Ce slug existe déjà" },
    };
  }

  const { error } = await supabase.from("announcement_categories").insert({
    slug,
    label,
    icon_name,
    color_hex,
    sort_order,
    map_pin_url: map_pin_url || null,
    default_image_url: default_image_url || null,
  });

  if (error) {
    console.error("[createAnnouncementCategory] DB error:", error);
    return { success: false, error: "Erreur lors de la création" };
  }

  revalidateTag(ANNOUNCEMENT_CATEGORIES_CACHE_TAG, "max");
  return { success: true };
}

export async function updateAnnouncementCategory(
  slug: string,
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requirePlatformAdmin();

  const raw = parseFormData(formData);
  const parsed = categorySchema.omit({ slug: true }).safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString() ?? "form";
      fieldErrors[field] = issue.message;
    }
    return { success: false, error: "Données invalides", fieldErrors };
  }

  const { label, icon_name, color_hex, sort_order, map_pin_url, default_image_url } =
    parsed.data;

  const supabase = await createClient();

  const { error } = await supabase
    .from("announcement_categories")
    .update({
      label,
      icon_name,
      color_hex,
      sort_order,
      map_pin_url: map_pin_url || null,
      default_image_url: default_image_url || null,
    })
    .eq("slug", slug);

  if (error) {
    console.error("[updateAnnouncementCategory] DB error:", error);
    return { success: false, error: "Erreur lors de la mise à jour" };
  }

  revalidateTag(ANNOUNCEMENT_CATEGORIES_CACHE_TAG, "max");
  return { success: true };
}

export async function deleteAnnouncementCategory(
  slug: string,
): Promise<CategoryFormState> {
  await requirePlatformAdmin();

  if (!slug) {
    return { success: false, error: "Slug requis" };
  }

  const supabase = await createClient();

  const { count } = await supabase
    .from("announcements")
    .select("id", { count: "exact", head: true })
    .eq("category_slug", slug);

  if (count && count > 0) {
    return {
      success: false,
      error: `Impossible de supprimer : ${count} annonce${count > 1 ? "s" : ""} utilise${count > 1 ? "nt" : ""} cette catégorie`,
    };
  }

  const { error } = await supabase
    .from("announcement_categories")
    .delete()
    .eq("slug", slug);

  if (error) {
    console.error("[deleteAnnouncementCategory] DB error:", error);
    if (error.code === "23503") {
      return {
        success: false,
        error: "Impossible de supprimer : des annonces utilisent cette catégorie",
      };
    }
    return { success: false, error: "Erreur lors de la suppression" };
  }

  revalidateTag(ANNOUNCEMENT_CATEGORIES_CACHE_TAG, "max");
  return { success: true };
}

export async function getAnnouncementCountByCategory(
  slug: string,
): Promise<number> {
  await requirePlatformAdmin();

  const supabase = await createClient();
  const { count } = await supabase
    .from("announcements")
    .select("id", { count: "exact", head: true })
    .eq("category_slug", slug);

  return count ?? 0;
}
