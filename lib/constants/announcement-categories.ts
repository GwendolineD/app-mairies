import type { AnnouncementCategoryRow } from "@/lib/types";
import {
  resolveIcon,
  type LucideIcon,
  MoreHorizontal,
} from "@/lib/utils/lucide-icon-map";

export type { LucideIcon };

/**
 * Category with Icon component attached (for UI rendering).
 * Backward-compatible with the old hardcoded type.
 */
export type AnnouncementCategory = {
  slug: string;
  label: string;
  colorHex: string;
  Icon: LucideIcon;
  defaultPhotoUrl: string;
  /** New fields from DB */
  icon_name: string | null;
  map_pin_url: string | null;
};

export type AnnouncementCategorySlug = string;

// ---------------------------------------------------------------------------
// Module-level cache, populated by initCategories() called in server layouts
// ---------------------------------------------------------------------------

let _categories: AnnouncementCategoryRow[] = [];
let _bySlug = new Map<string, AnnouncementCategoryRow>();
let _initialized = false;

/**
 * Initialize the category cache from DB data.
 * Must be called in server layouts before rendering pages that use categories.
 *
 * In Next.js App Router, each request creates a fresh module scope on the server,
 * so this is called once per request.
 */
export function initCategories(rows: AnnouncementCategoryRow[]): void {
  _categories = rows;
  _bySlug = new Map(rows.map((r) => [r.slug, r]));
  _initialized = true;
}

/**
 * Check if categories have been initialized for this request.
 */
export function areCategoriesInitialized(): boolean {
  return _initialized;
}

// ---------------------------------------------------------------------------
// Fallback data for when categories are not yet initialized (client components,
// or if initCategories() was not called). Uses hardcoded defaults as fallback.
// ---------------------------------------------------------------------------

const FALLBACK_CATEGORIES: AnnouncementCategoryRow[] = [
  { slug: "bricolage", label: "Bricolage", sort_order: 1, icon_name: "hammer", color_hex: "#E85D3A", map_pin_url: null, default_image_url: "https://res.cloudinary.com/du3ko16j1/image/upload/v1781280253/app-mairies/illustrations/annonce-categorie-image-default/bricolage_2_xgz7dd.png" },
  { slug: "numerique", label: "Numérique", sort_order: 2, icon_name: "monitor", color_hex: "#5CBDB9", map_pin_url: null, default_image_url: "https://res.cloudinary.com/du3ko16j1/image/upload/v1781280255/app-mairies/illustrations/annonce-categorie-image-default/numerique_2_bqxjvf.png" },
  { slug: "transport", label: "Transport", sort_order: 3, icon_name: "car", color_hex: "#4A9FD4", map_pin_url: null, default_image_url: "https://res.cloudinary.com/du3ko16j1/image/upload/v1781280256/app-mairies/illustrations/annonce-categorie-image-default/transport_2_thbebj.png" },
  { slug: "alimentaire", label: "Alimentaire", sort_order: 4, icon_name: "shopping-basket", color_hex: "#F4A261", map_pin_url: null, default_image_url: "https://res.cloudinary.com/du3ko16j1/image/upload/v1781280252/app-mairies/illustrations/annonce-categorie-image-default/alimentaire_-_Moyenne_sjiy1u.png" },
  { slug: "garde-pontuelle", label: "Garde ponctuelle", sort_order: 5, icon_name: "users", color_hex: "#E89AB8", map_pin_url: null, default_image_url: "https://res.cloudinary.com/du3ko16j1/image/upload/v1781280254/app-mairies/illustrations/annonce-categorie-image-default/garde-enfants_2_ilgrha.png" },
  { slug: "paperasse", label: "Paperasse", sort_order: 6, icon_name: "file-text", color_hex: "#E8C07A", map_pin_url: null, default_image_url: "https://res.cloudinary.com/du3ko16j1/image/upload/v1781280256/app-mairies/illustrations/annonce-categorie-image-default/paperasse_2_jlabjc.png" },
  { slug: "animaux", label: "Animaux", sort_order: 7, icon_name: "paw-print", color_hex: "#B58463", map_pin_url: null, default_image_url: "https://res.cloudinary.com/du3ko16j1/image/upload/v1781280252/app-mairies/illustrations/annonce-categorie-image-default/animaux_-_Moyenne_grssuv.png" },
  { slug: "jardinage-exterieur", label: "Jardinage & extérieur", sort_order: 8, icon_name: "leaf", color_hex: "#7BB661", map_pin_url: null, default_image_url: "https://res.cloudinary.com/du3ko16j1/image/upload/v1781280254/app-mairies/illustrations/annonce-categorie-image-default/jardin-exterieur_2_etmein.png" },
  { slug: "pret-objet", label: "Prêt d'objet", sort_order: 9, icon_name: "package", color_hex: "#8FA8C9", map_pin_url: null, default_image_url: "https://res.cloudinary.com/du3ko16j1/image/upload/v1781280256/app-mairies/illustrations/annonce-categorie-image-default/pret-objet_2_emrbqp.png" },
  { slug: "don-troc", label: "Don & troc", sort_order: 10, icon_name: "gift", color_hex: "#B084CC", map_pin_url: null, default_image_url: "https://res.cloudinary.com/du3ko16j1/image/upload/v1781280253/app-mairies/illustrations/annonce-categorie-image-default/don-troc_2_jeqxql.png" },
  { slug: "loisirs", label: "Loisirs", sort_order: 11, icon_name: "music", color_hex: "#E8688F", map_pin_url: null, default_image_url: "https://res.cloudinary.com/du3ko16j1/image/upload/v1781280255/app-mairies/illustrations/annonce-categorie-image-default/loisirs_2_hvzfoe.png" },
  { slug: "autre", label: "Autre", sort_order: 12, icon_name: "more-horizontal", color_hex: "#A8A8A8", map_pin_url: null, default_image_url: "https://res.cloudinary.com/du3ko16j1/image/upload/v1781280253/app-mairies/illustrations/annonce-categorie-image-default/autre_2_s1dc51.png" },
];

function getCategories(): AnnouncementCategoryRow[] {
  if (_initialized && _categories.length > 0) {
    return _categories;
  }
  return FALLBACK_CATEGORIES;
}

function getBySlugMap(): Map<string, AnnouncementCategoryRow> {
  if (_initialized && _bySlug.size > 0) {
    return _bySlug;
  }
  return new Map(FALLBACK_CATEGORIES.map((r) => [r.slug, r]));
}

// ---------------------------------------------------------------------------
// Convert DB row to UI-friendly category with Icon component
// ---------------------------------------------------------------------------

function rowToCategory(row: AnnouncementCategoryRow): AnnouncementCategory {
  return {
    slug: row.slug,
    label: row.label,
    colorHex: row.color_hex,
    Icon: resolveIcon(row.icon_name),
    defaultPhotoUrl:
      row.default_image_url ??
      "https://res.cloudinary.com/du3ko16j1/image/upload/v1781280253/app-mairies/illustrations/annonce-categorie-image-default/autre_2_s1dc51.png",
    icon_name: row.icon_name,
    map_pin_url: row.map_pin_url,
  };
}

// ---------------------------------------------------------------------------
// Public API — signatures unchanged from original file
// ---------------------------------------------------------------------------

/**
 * All announcement categories with Icon components attached.
 * Reads from DB cache if initialized, falls back to hardcoded data otherwise.
 */
export function getAnnouncementCategories(): AnnouncementCategory[] {
  return getCategories().map(rowToCategory);
}

/**
 * Array-like accessor for backward compatibility.
 * Components that iterate over ANNOUNCEMENT_CATEGORIES should use this.
 */
export const ANNOUNCEMENT_CATEGORIES: AnnouncementCategory[] = new Proxy(
  [] as AnnouncementCategory[],
  {
    get(_, prop) {
      const cats = getAnnouncementCategories();
      if (prop === "length") return cats.length;
      if (prop === "map") return cats.map.bind(cats);
      if (prop === "filter") return cats.filter.bind(cats);
      if (prop === "find") return cats.find.bind(cats);
      if (prop === "forEach") return cats.forEach.bind(cats);
      if (prop === "some") return cats.some.bind(cats);
      if (prop === "every") return cats.every.bind(cats);
      if (prop === "reduce") return cats.reduce.bind(cats);
      if (prop === "flatMap") return cats.flatMap.bind(cats);
      if (prop === Symbol.iterator) return cats[Symbol.iterator].bind(cats);
      if (typeof prop === "string" && !isNaN(Number(prop))) {
        return cats[Number(prop)];
      }
      return undefined;
    },
  },
);

/**
 * Tuple of category slugs for Zod validation.
 * Dynamic: reads from cache when accessed.
 */
export function getAnnouncementCategorySlugs(): [string, ...string[]] {
  const slugs = getCategories().map((c) => c.slug);
  if (slugs.length === 0) return ["autre"];
  return slugs as [string, ...string[]];
}

/**
 * For backward compatibility with code using ANNOUNCEMENT_CATEGORY_SLUGS directly.
 */
export const ANNOUNCEMENT_CATEGORY_SLUGS: [string, ...string[]] = new Proxy(
  ["autre"] as [string, ...string[]],
  {
    get(_, prop) {
      const slugs = getAnnouncementCategorySlugs();
      if (prop === "length") return slugs.length;
      if (prop === "map") return slugs.map.bind(slugs);
      if (prop === "includes") return slugs.includes.bind(slugs);
      if (prop === Symbol.iterator) return slugs[Symbol.iterator].bind(slugs);
      if (typeof prop === "string" && !isNaN(Number(prop))) {
        return slugs[Number(prop)];
      }
      return undefined;
    },
  },
) as [string, ...string[]];

/** @deprecated Use ANNOUNCEMENT_CATEGORY_SLUGS */
export const categorySlugs = ANNOUNCEMENT_CATEGORY_SLUGS;

export function getCategoryBySlug(
  slug: string,
): AnnouncementCategory | undefined {
  const row = getBySlugMap().get(slug);
  return row ? rowToCategory(row) : undefined;
}

export function getCategoryLabel(slug: string): string {
  return getBySlugMap().get(slug)?.label ?? slug;
}

export function getCategoryColorHex(slug: string): string {
  return getBySlugMap().get(slug)?.color_hex ?? "#A8A8A8";
}

export function getCategoryIcon(slug: string): LucideIcon {
  const row = getBySlugMap().get(slug);
  return resolveIcon(row?.icon_name ?? null);
}

export function getCategoryDefaultPhotoUrl(slug: string): string {
  const row = getBySlugMap().get(slug);
  if (row?.default_image_url) return row.default_image_url;
  const autreRow = getBySlugMap().get("autre");
  return (
    autreRow?.default_image_url ??
    "https://res.cloudinary.com/du3ko16j1/image/upload/v1781280253/app-mairies/illustrations/annonce-categorie-image-default/autre_2_s1dc51.png"
  );
}

export function getCategoryMapPinUrl(slug: string): string | null {
  return getBySlugMap().get(slug)?.map_pin_url ?? null;
}

/**
 * Get raw DB rows (without Icon component).
 * Useful for serialization to client components.
 */
export function getCategoryRows(): AnnouncementCategoryRow[] {
  return getCategories();
}
