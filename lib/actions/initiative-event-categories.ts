"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ROUTES } from "@/lib/constants/routes";
import { INITIATIVE_EVENT_CATEGORIES_CACHE_TAG } from "@/lib/queries/initiative-event-categories";

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

export type InitiativeEventCategoryFormState = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

function invalidateInitiativeEventCategoriesCache() {
  updateTag(INITIATIVE_EVENT_CATEGORIES_CACHE_TAG);
  revalidatePath(ROUTES.backoffice.categoriesInitiatives);
}

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

export async function createInitiativeEventCategory(
  _prev: InitiativeEventCategoryFormState,
  formData: FormData,
): Promise<InitiativeEventCategoryFormState> {
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
    .from("initiative_event_categories")
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

  const { error } = await supabase.from("initiative_event_categories").insert({
    slug,
    label,
    icon_name,
    color_hex,
    sort_order,
    map_pin_url: map_pin_url || null,
    default_image_url: default_image_url || null,
  });

  if (error) {
    console.error("[createInitiativeEventCategory] DB error:", error);
    return { success: false, error: "Erreur lors de la création" };
  }

  invalidateInitiativeEventCategoriesCache();
  return { success: true };
}

export async function updateInitiativeEventCategory(
  slug: string,
  _prev: InitiativeEventCategoryFormState,
  formData: FormData,
): Promise<InitiativeEventCategoryFormState> {
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
    .from("initiative_event_categories")
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
    console.error("[updateInitiativeEventCategory] DB error:", error);
    return { success: false, error: "Erreur lors de la mise à jour" };
  }

  invalidateInitiativeEventCategoriesCache();
  return { success: true };
}

export async function deleteInitiativeEventCategory(
  slug: string,
): Promise<InitiativeEventCategoryFormState> {
  await requirePlatformAdmin();

  if (!slug) {
    return { success: false, error: "Slug requis" };
  }

  const supabase = await createClient();

  const { count: initiativeCount } = await supabase
    .from("initiatives")
    .select("id", { count: "exact", head: true })
    .eq("category_slug", slug);

  const { count: eventCount } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("category_slug", slug);

  const total = (initiativeCount ?? 0) + (eventCount ?? 0);
  if (total > 0) {
    return {
      success: false,
      error: `Impossible de supprimer : ${total} contenu${total > 1 ? "s" : ""} utilise${total > 1 ? "nt" : ""} cette catégorie`,
    };
  }

  const { error } = await supabase
    .from("initiative_event_categories")
    .delete()
    .eq("slug", slug);

  if (error) {
    console.error("[deleteInitiativeEventCategory] DB error:", error);
    if (error.code === "23503") {
      return {
        success: false,
        error: "Impossible de supprimer : des contenus utilisent cette catégorie",
      };
    }
    return { success: false, error: "Erreur lors de la suppression" };
  }

  invalidateInitiativeEventCategoriesCache();
  return { success: true };
}
