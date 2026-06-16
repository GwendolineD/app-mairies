import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import type { AnnouncementCategoryRow } from "@/lib/types";

export const ANNOUNCEMENT_CATEGORIES_CACHE_TAG = "announcement-categories";

/**
 * Create an anonymous Supabase client for public reads.
 * Does not use cookies - safe for use inside unstable_cache.
 */
function createAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

/**
 * Fetch all announcement categories from DB with aggressive caching.
 * Categories rarely change — cache for 1h with on-demand revalidation via tag.
 * Uses an anonymous client since categories are public (RLS allows anon SELECT).
 */
export const getAnnouncementCategories = unstable_cache(
  async (): Promise<AnnouncementCategoryRow[]> => {
    const supabase = createAnonClient();
    const { data, error } = await supabase
      .from("announcement_categories")
      .select(
        "slug, label, sort_order, icon_name, color_hex, map_pin_url, default_image_url",
      )
      .order("sort_order");

    if (error) {
      console.error("[getAnnouncementCategories] DB error:", error);
      return [];
    }

    return data ?? [];
  },
  ["announcement-categories"],
  { tags: [ANNOUNCEMENT_CATEGORIES_CACHE_TAG], revalidate: 3600 },
);

/**
 * Get a single category by slug. Uses the cached list internally.
 */
export async function getAnnouncementCategoryBySlug(
  slug: string,
): Promise<AnnouncementCategoryRow | undefined> {
  const categories = await getAnnouncementCategories();
  return categories.find((c) => c.slug === slug);
}
