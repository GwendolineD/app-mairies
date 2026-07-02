"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { CategoryFormState } from "@/lib/actions/types";

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

type CrudConfig = {
  table: string;
  cacheTag: string;
  revalidatePaths: readonly string[];
  /** Tables referencing this category via `category_slug` FK */
  usageTables: readonly string[];
  logPrefix: string;
};

function invalidateCache(config: CrudConfig) {
  updateTag(config.cacheTag);
  for (const path of config.revalidatePaths) {
    revalidatePath(path);
  }
}

export async function createCategory(
  config: CrudConfig,
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase.from as any)(config.table)
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)(config.table).insert({
    slug,
    label,
    icon_name,
    color_hex,
    sort_order,
    map_pin_url: map_pin_url || null,
    default_image_url: default_image_url || null,
  });

  if (error) {
    console.error(`[${config.logPrefix}:create] DB error:`, error);
    return { success: false, error: "Erreur lors de la création" };
  }

  invalidateCache(config);
  return { success: true };
}

export async function updateCategory(
  config: CrudConfig,
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)(config.table)
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
    console.error(`[${config.logPrefix}:update] DB error:`, error);
    return { success: false, error: "Erreur lors de la mise à jour" };
  }

  invalidateCache(config);
  return { success: true };
}

export async function deleteCategory(
  config: CrudConfig,
  slug: string,
): Promise<CategoryFormState> {
  await requirePlatformAdmin();

  if (!slug) {
    return { success: false, error: "Slug requis" };
  }

  const supabase = await createClient();

  let totalUsage = 0;
  for (const usageTable of config.usageTables) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (supabase.from as any)(usageTable)
      .select("id", { count: "exact", head: true })
      .eq("category_slug", slug);
    totalUsage += count ?? 0;
  }

  if (totalUsage > 0) {
    return {
      success: false,
      error: `Impossible de supprimer : ${totalUsage} contenu${totalUsage > 1 ? "s" : ""} utilise${totalUsage > 1 ? "nt" : ""} cette catégorie`,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)(config.table).delete().eq("slug", slug);

  if (error) {
    console.error(`[${config.logPrefix}:delete] DB error:`, error);
    if (error.code === "23503") {
      return {
        success: false,
        error: "Impossible de supprimer : des contenus utilisent cette catégorie",
      };
    }
    return { success: false, error: "Erreur lors de la suppression" };
  }

  invalidateCache(config);
  return { success: true };
}

export async function getCategoryUsageCount(
  config: CrudConfig,
  slug: string,
): Promise<number> {
  await requirePlatformAdmin();
  const supabase = await createClient();

  let total = 0;
  for (const usageTable of config.usageTables) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (supabase.from as any)(usageTable)
      .select("id", { count: "exact", head: true })
      .eq("category_slug", slug);
    total += count ?? 0;
  }
  return total;
}
