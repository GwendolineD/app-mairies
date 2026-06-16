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

export function getInitiativePinHex(categorySlug: string): string {
  const token =
    INITIATIVE_CATEGORY_PIN_COLORS[categorySlug as InitiativeCategorySlug] ??
    "mint";
  return MAP_PIN_HEX[token];
}

export function getEventPinHex(): string {
  return MAP_PIN_HEX[EVENT_PIN_COLOR];
}
