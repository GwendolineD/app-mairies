import L from "leaflet";

export type AnnouncementPinSize = "default" | "large";

const PIN_SIZES: Record<
  AnnouncementPinSize,
  { default: number; selected: number }
> = {
  default: { default: 36, selected: 44 },
  large: { default: 72, selected: 88 },
};

export type AnnouncementPinOptions = {
  mapPinUrl: string | null;
  colorHex: string;
};

/**
 * Category-aware pin icon for announcement map markers.
 * Takes explicit mapPinUrl and colorHex from the joined category data.
 */
export function createAnnouncementPinIcon(
  opts: AnnouncementPinOptions,
  selected = false,
  pinSize: AnnouncementPinSize = "default",
): L.DivIcon {
  const { mapPinUrl, colorHex } = opts;
  const size = PIN_SIZES[pinSize][selected ? "selected" : "default"];
  const shadow = selected
    ? "drop-shadow(0 0 0 4px rgba(154,82,255,0.35)) drop-shadow(0 2px 8px rgba(37,38,48,0.22))"
    : "drop-shadow(0 2px 8px rgba(37,38,48,0.22))";
  const fallbackHtml = `<div style="background:${colorHex};width:${size - 8}px;height:${size - 8}px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(37,38,48,0.22);"></div>`;
  const html = mapPinUrl
    ? `<img src="${mapPinUrl}" alt="" width="${size}" height="${size}" style="width:${size}px;height:${size}px;object-fit:contain;display:block;filter:${shadow};" />`
    : fallbackHtml;

  return L.divIcon({
    className: "vl-map-pin !border-0 !bg-transparent",
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
}

/**
 * Cluster pin icon with a count badge.
 * Used when multiple announcements share the same location.
 */
export function createClusterPinIcon(
  opts: AnnouncementPinOptions,
  count: number,
  selected = false,
  pinSize: AnnouncementPinSize = "default",
): L.DivIcon {
  const { mapPinUrl, colorHex } = opts;
  const size = PIN_SIZES[pinSize][selected ? "selected" : "default"];
  const shadow = selected
    ? "drop-shadow(0 0 0 4px rgba(154,82,255,0.35)) drop-shadow(0 2px 8px rgba(37,38,48,0.22))"
    : "drop-shadow(0 2px 8px rgba(37,38,48,0.22))";

  const badgeSize = 18;
  const badgeStyle = `position:absolute;top:-4px;right:-4px;width:${badgeSize}px;height:${badgeSize}px;border-radius:50%;background:#9A52FF;color:white;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 1px 4px rgba(37,38,48,0.25);`;

  const fallbackHtml = `<div style="position:relative;"><div style="background:${colorHex};width:${size - 8}px;height:${size - 8}px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(37,38,48,0.22);"></div><span style="${badgeStyle}">${count}</span></div>`;

  const html = mapPinUrl
    ? `<div style="position:relative;"><img src="${mapPinUrl}" alt="" width="${size}" height="${size}" style="width:${size}px;height:${size}px;object-fit:contain;display:block;filter:${shadow};" /><span style="${badgeStyle}">${count}</span></div>`
    : fallbackHtml;

  return L.divIcon({
    className: "vl-map-pin !border-0 !bg-transparent",
    html,
    iconSize: [size + 8, size + 8],
    iconAnchor: [(size + 8) / 2, size + 4],
  });
}

/**
 * Legacy function signature for backward compatibility.
 * Uses the facade to look up category data.
 * @deprecated Use createAnnouncementPinIcon with explicit options instead.
 */
export function createAnnouncementPinIconBySlug(
  categorySlug: string,
  selected = false,
  pinSize: AnnouncementPinSize = "default",
): L.DivIcon {
  const {
    getCategoryColorHex,
    getCategoryMapPinUrl,
  } = require("@/lib/constants/announcement-categories");

  return createAnnouncementPinIcon(
    {
      mapPinUrl: getCategoryMapPinUrl(categorySlug),
      colorHex: getCategoryColorHex(categorySlug),
    },
    selected,
    pinSize,
  );
}
