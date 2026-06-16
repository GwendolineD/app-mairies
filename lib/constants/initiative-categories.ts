import type { InitiativeEventCategoryRow } from "@/lib/types";
import {
  resolveIcon,
  type LucideIcon,
} from "@/lib/utils/lucide-icon-map";

export type { LucideIcon };

export type InitiativeEventCategory = {
  slug: string;
  label: string;
  colorHex: string;
  Icon: LucideIcon;
  defaultImageUrl: string;
  icon_name: string | null;
  map_pin_url: string | null;
};

export type InitiativeCategorySlug = string;

// ---------------------------------------------------------------------------
// Module-level cache, populated by initInitiativeEventCategories() in layouts
// ---------------------------------------------------------------------------

let _categories: InitiativeEventCategoryRow[] = [];
let _bySlug = new Map<string, InitiativeEventCategoryRow>();
let _initialized = false;

export function initInitiativeEventCategories(
  rows: InitiativeEventCategoryRow[],
): void {
  _categories = rows;
  _bySlug = new Map(rows.map((r) => [r.slug, r]));
  _initialized = true;
}

export function areInitiativeEventCategoriesInitialized(): boolean {
  return _initialized;
}

// ---------------------------------------------------------------------------
// Fallback data (client components or if init was not called)
// ---------------------------------------------------------------------------

const FALLBACK_CATEGORIES: InitiativeEventCategoryRow[] = [
  { slug: "solidarite", label: "Solidarité", sort_order: 1, icon_name: "heart-handshake", color_hex: "#FF6B6B", map_pin_url: "https://res.cloudinary.com/du3ko16j1/image/upload/v1781597749/app-mairies/illustrations/initiative-event-categories-pin/solidarite-small_eq7cem.png", default_image_url: "https://res.cloudinary.com/du3ko16j1/image/upload/v1781599350/app-mairies/illustrations/initiative-event-image-default/solidarite_-_Moyenne_xkxls9.png" },
  { slug: "nature", label: "Nature", sort_order: 2, icon_name: "leaf", color_hex: "#74E3B2", map_pin_url: "https://res.cloudinary.com/du3ko16j1/image/upload/v1781597746/app-mairies/illustrations/initiative-event-categories-pin/nature-small_wd0orp.png", default_image_url: "https://res.cloudinary.com/du3ko16j1/image/upload/v1781599347/app-mairies/illustrations/initiative-event-image-default/nature_-_Moyenne_wsyfio.png" },
  { slug: "culture", label: "Culture", sort_order: 3, icon_name: "palette", color_hex: "#9A52FF", map_pin_url: "https://res.cloudinary.com/du3ko16j1/image/upload/v1781597742/app-mairies/illustrations/initiative-event-categories-pin/culture-small_lnc9kh.png", default_image_url: "https://res.cloudinary.com/du3ko16j1/image/upload/v1781599341/app-mairies/illustrations/initiative-event-image-default/culture_-_Moyenne_wifzuj.png" },
  { slug: "convivialite", label: "Convivialité", sort_order: 4, icon_name: "party-popper", color_hex: "#FF7FCB", map_pin_url: "https://res.cloudinary.com/du3ko16j1/image/upload/v1781597741/app-mairies/illustrations/initiative-event-categories-pin/convivialite-small_l7fnk1.png", default_image_url: "https://res.cloudinary.com/du3ko16j1/image/upload/v1781599340/app-mairies/illustrations/initiative-event-image-default/convivialite_-_Moyenne_ctjapz.png" },
  { slug: "sport", label: "Sport", sort_order: 5, icon_name: "dumbbell", color_hex: "#FFB347", map_pin_url: "https://res.cloudinary.com/du3ko16j1/image/upload/v1781597750/app-mairies/illustrations/initiative-event-categories-pin/sport-small_vpszdn.png", default_image_url: "https://res.cloudinary.com/du3ko16j1/image/upload/v1781599352/app-mairies/illustrations/initiative-event-image-default/sport_-_Moyenne_tgayhl.png" },
  { slug: "jeunesse", label: "Jeunesse", sort_order: 6, icon_name: "baby", color_hex: "#FFC93D", map_pin_url: "https://res.cloudinary.com/du3ko16j1/image/upload/v1781597744/app-mairies/illustrations/initiative-event-categories-pin/jeunesse-small_gfa4hf.png", default_image_url: "https://res.cloudinary.com/du3ko16j1/image/upload/v1781599344/app-mairies/illustrations/initiative-event-image-default/jeunesse_-_Moyenne_o7qjkr.png" },
  { slug: "seniors", label: "Seniors", sort_order: 7, icon_name: "armchair", color_hex: "#35D1D1", map_pin_url: "https://res.cloudinary.com/du3ko16j1/image/upload/v1781597748/app-mairies/illustrations/initiative-event-categories-pin/senior-small_vmbkqz.png", default_image_url: "https://res.cloudinary.com/du3ko16j1/image/upload/v1781599349/app-mairies/illustrations/initiative-event-image-default/senior_-_Moyenne_ajlhb9.png" },
  { slug: "numerique", label: "Numérique", sort_order: 8, icon_name: "monitor", color_hex: "#1BB9D9", map_pin_url: "https://res.cloudinary.com/du3ko16j1/image/upload/v1781597747/app-mairies/illustrations/initiative-event-categories-pin/numerique-small_hhh7ix.png", default_image_url: "https://res.cloudinary.com/du3ko16j1/image/upload/v1781599348/app-mairies/illustrations/initiative-event-image-default/numerique_-_Moyenne_rjq8mi.png" },
  { slug: "intergenerationnel", label: "Intergénérationnel", sort_order: 9, icon_name: "users", color_hex: "#F120D2", map_pin_url: "https://res.cloudinary.com/du3ko16j1/image/upload/v1781597743/app-mairies/illustrations/initiative-event-categories-pin/intergenerationnel-small_m71z9m.png", default_image_url: "https://res.cloudinary.com/du3ko16j1/image/upload/v1781599343/app-mairies/illustrations/initiative-event-image-default/intergenerationnel_-_Moyenne_jqq9wi.png" },
  { slug: "mobilite", label: "Mobilité", sort_order: 10, icon_name: "car", color_hex: "#4A9FD4", map_pin_url: "https://res.cloudinary.com/du3ko16j1/image/upload/v1781597745/app-mairies/illustrations/initiative-event-categories-pin/mobilite-small_qh8l3c.png", default_image_url: "https://res.cloudinary.com/du3ko16j1/image/upload/v1781599345/app-mairies/illustrations/initiative-event-image-default/mobilite_-_Moyenne_tjwh2q.png" },
  { slug: "citoyennete", label: "Citoyenneté", sort_order: 11, icon_name: "landmark", color_hex: "#E8C07A", map_pin_url: "https://res.cloudinary.com/du3ko16j1/image/upload/v1781597739/app-mairies/illustrations/initiative-event-categories-pin/citoyennete-small_shmhps.png", default_image_url: "https://res.cloudinary.com/du3ko16j1/image/upload/v1781599339/app-mairies/illustrations/initiative-event-image-default/citoyennete_2_hlnbif.png" },
  { slug: "autre", label: "Autre", sort_order: 12, icon_name: "more-horizontal", color_hex: "#A8A8A8", map_pin_url: "https://res.cloudinary.com/du3ko16j1/image/upload/v1781597739/app-mairies/illustrations/initiative-event-categories-pin/autre-small_ihquwt.png", default_image_url: "https://res.cloudinary.com/du3ko16j1/image/upload/v1781599339/app-mairies/illustrations/initiative-event-image-default/autre_-_Moyenne_si9mws.png" },
];

function getCategories(): InitiativeEventCategoryRow[] {
  if (_initialized && _categories.length > 0) return _categories;
  return FALLBACK_CATEGORIES;
}

function getBySlugMap(): Map<string, InitiativeEventCategoryRow> {
  if (_initialized && _bySlug.size > 0) return _bySlug;
  return new Map(FALLBACK_CATEGORIES.map((r) => [r.slug, r]));
}

function rowToCategory(row: InitiativeEventCategoryRow): InitiativeEventCategory {
  return {
    slug: row.slug,
    label: row.label,
    colorHex: row.color_hex,
    Icon: resolveIcon(row.icon_name),
    defaultImageUrl:
      row.default_image_url ??
      "https://res.cloudinary.com/du3ko16j1/image/upload/v1781599339/app-mairies/illustrations/initiative-event-image-default/autre_-_Moyenne_si9mws.png",
    icon_name: row.icon_name,
    map_pin_url: row.map_pin_url,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getInitiativeEventCategoriesUI(): InitiativeEventCategory[] {
  return getCategories().map(rowToCategory);
}

/**
 * Backward-compatible array proxy for INITIATIVE_CATEGORIES.
 */
export const INITIATIVE_CATEGORIES: InitiativeEventCategory[] = new Proxy(
  [] as InitiativeEventCategory[],
  {
    get(_, prop) {
      const cats = getInitiativeEventCategoriesUI();
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

export function getInitiativeEventCategorySlugs(): [string, ...string[]] {
  const slugs = getCategories().map((c) => c.slug);
  if (slugs.length === 0) return ["autre"];
  return slugs as [string, ...string[]];
}

export const INITIATIVE_CATEGORY_SLUGS: [string, ...string[]] = new Proxy(
  ["autre"] as [string, ...string[]],
  {
    get(_, prop) {
      const slugs = getInitiativeEventCategorySlugs();
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

export function getInitiativeCategoryBySlug(
  slug: string,
): InitiativeEventCategory | undefined {
  const row = getBySlugMap().get(slug);
  return row ? rowToCategory(row) : undefined;
}

export function getInitiativeCategoryLabel(slug: string): string {
  return getBySlugMap().get(slug)?.label ?? slug;
}

export function getInitiativeCategoryColorHex(slug: string): string {
  return getBySlugMap().get(slug)?.color_hex ?? "#A8A8A8";
}

export function getInitiativeCategoryMapPinUrl(slug: string): string | null {
  return getBySlugMap().get(slug)?.map_pin_url ?? null;
}

export function getInitiativeCategoryDefaultImageUrl(slug: string): string {
  const row = getBySlugMap().get(slug);
  if (row?.default_image_url) return row.default_image_url;
  const autreRow = getBySlugMap().get("autre");
  return (
    autreRow?.default_image_url ??
    "https://res.cloudinary.com/du3ko16j1/image/upload/v1781599339/app-mairies/illustrations/initiative-event-image-default/autre_-_Moyenne_si9mws.png"
  );
}

export function getInitiativeEventCategoryRows(): InitiativeEventCategoryRow[] {
  return getCategories();
}
