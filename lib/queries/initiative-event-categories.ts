import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import type { InitiativeEventCategoryRow } from "@/lib/types";

export const INITIATIVE_EVENT_CATEGORIES_CACHE_TAG =
  "initiative-event-categories";

function createAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

/**
 * Fetch all initiative/event categories from DB with aggressive caching.
 * Uses an anonymous client since categories are public (RLS allows anon SELECT).
 */
export const getInitiativeEventCategories = unstable_cache(
  async (): Promise<InitiativeEventCategoryRow[]> => {
    const supabase = createAnonClient();
    const { data, error } = await supabase
      .from("initiative_event_categories")
      .select(
        "slug, label, sort_order, icon_name, color_hex, map_pin_url, default_image_url",
      )
      .order("sort_order");

    if (error) {
      console.error("[getInitiativeEventCategories] DB error:", error);
      return [];
    }

    return data ?? [];
  },
  ["initiative-event-categories"],
  { tags: [INITIATIVE_EVENT_CATEGORIES_CACHE_TAG], revalidate: 3600 },
);

export async function getInitiativeEventCategoryBySlug(
  slug: string,
): Promise<InitiativeEventCategoryRow | undefined> {
  const categories = await getInitiativeEventCategories();
  return categories.find((c) => c.slug === slug);
}
