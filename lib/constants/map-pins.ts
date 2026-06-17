import { getInitiativeCategoryMapPinUrl, getInitiativeCategoryColorHex } from "@/lib/constants/initiative-categories";

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

export const EVENT_PIN_COLOR: MapPinColorToken = "orange";

/**
 * Get the pin hex color for an initiative category.
 * Now reads from the DB-backed facade (color_hex from initiative_event_categories table).
 */
export function getInitiativePinHex(categorySlug: string): string {
  return getInitiativeCategoryColorHex(categorySlug);
}

/**
 * Get the pin image URL for an initiative category (Cloudinary image).
 * Returns null if the category has no configured pin.
 */
export function getInitiativePinUrl(categorySlug: string): string | null {
  return getInitiativeCategoryMapPinUrl(categorySlug);
}

export function getEventPinHex(): string {
  return MAP_PIN_HEX[EVENT_PIN_COLOR];
}
