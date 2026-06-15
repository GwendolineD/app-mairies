import {
  getCategoryColorHex,
  type AnnouncementCategorySlug,
} from "@/lib/constants/announcement-categories";
import type { InitiativeCategorySlug } from "@/lib/constants/initiative-categories";

/** Design-system color tokens for initiative / event map pins. */
export type MapPinColorToken =
  | "coral"
  | "orange"
  | "pink"
  | "magenta"
  | "purple"
  | "turquoise"
  | "aqua"
  | "mint"
  | "sun";

export const MAP_PIN_HEX: Record<MapPinColorToken, string> = {
  coral: "#ff6b6b",
  orange: "#ffb347",
  pink: "#ff7fcb",
  magenta: "#f120d2",
  purple: "#9a52ff",
  turquoise: "#35d1d1",
  aqua: "#1bb9d9",
  mint: "#74e3b2",
  sun: "#ffc93d",
};

export const INITIATIVE_CATEGORY_PIN_COLORS: Record<
  InitiativeCategorySlug,
  MapPinColorToken
> = {
  solidarite: "coral",
  nature: "mint",
  culture: "purple",
  convivialite: "pink",
  sport: "orange",
  jeunesse: "sun",
};

export const EVENT_PIN_COLOR: MapPinColorToken = "orange";

export function getAnnouncementPinHex(categorySlug: string): string {
  return getCategoryColorHex(categorySlug);
}

/**
 * Cloudinary illustrated pins per announcement category.
 * The MapContentView falls back to a colored circle if the image fails to load.
 */
export const ANNOUNCEMENT_CATEGORY_PIN_IMAGES: Record<
  AnnouncementCategorySlug,
  string
> = {
  transport:
    "https://res.cloudinary.com/du3ko16j1/image/upload/v1781508555/app-mairies/illustrations/annonces-categories-pin/transport-small_dgq6um.png",
  "pret-objet":
    "https://res.cloudinary.com/du3ko16j1/image/upload/v1781508555/app-mairies/illustrations/annonces-categories-pin/pret-objet-small_uyozmf.png",
  paperasse:
    "https://res.cloudinary.com/du3ko16j1/image/upload/v1781508554/app-mairies/illustrations/annonces-categories-pin/paperasse-small_elhdlk.png",
  numerique:
    "https://res.cloudinary.com/du3ko16j1/image/upload/v1781508553/app-mairies/illustrations/annonces-categories-pin/numerique-small_hpbzaf.png",
  loisirs:
    "https://res.cloudinary.com/du3ko16j1/image/upload/v1781508553/app-mairies/illustrations/annonces-categories-pin/loisirs-small_eiepsv.png",
  "jardinage-exterieur":
    "https://res.cloudinary.com/du3ko16j1/image/upload/v1781508552/app-mairies/illustrations/annonces-categories-pin/jardinage-exterieur-small_xe5567.png",
  "garde-pontuelle":
    "https://res.cloudinary.com/du3ko16j1/image/upload/v1781508552/app-mairies/illustrations/annonces-categories-pin/garde-enfant-small_krbvcz.png",
  "don-troc":
    "https://res.cloudinary.com/du3ko16j1/image/upload/v1781508551/app-mairies/illustrations/annonces-categories-pin/don-troc-small_r5eifr.png",
  bricolage:
    "https://res.cloudinary.com/du3ko16j1/image/upload/v1781508550/app-mairies/illustrations/annonces-categories-pin/bricolage-small_dk2phc.png",
  autre:
    "https://res.cloudinary.com/du3ko16j1/image/upload/v1781508550/app-mairies/illustrations/annonces-categories-pin/autre-small_kq7l8b.png",
  animaux:
    "https://res.cloudinary.com/du3ko16j1/image/upload/v1781508550/app-mairies/illustrations/annonces-categories-pin/animaux-small_dyhb3o.png",
  alimentaire:
    "https://res.cloudinary.com/du3ko16j1/image/upload/v1781508549/app-mairies/illustrations/annonces-categories-pin/alimentation-small_govrc3.png",
};

export function getAnnouncementPinImage(categorySlug: string): string | undefined {
  return ANNOUNCEMENT_CATEGORY_PIN_IMAGES[categorySlug as AnnouncementCategorySlug];
}

export function getInitiativePinHex(categorySlug: string): string {
  const token =
    INITIATIVE_CATEGORY_PIN_COLORS[
      categorySlug as InitiativeCategorySlug
    ] ?? "mint";
  return MAP_PIN_HEX[token];
}

export function getEventPinHex(): string {
  return MAP_PIN_HEX[EVENT_PIN_COLOR];
}
