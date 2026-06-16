import L from "leaflet";
import {
  getAnnouncementPinHex,
  getAnnouncementPinImage,
} from "@/lib/constants/map-pins";

export type AnnouncementPinSize = "default" | "large";

const PIN_SIZES: Record<AnnouncementPinSize, { default: number; selected: number }> = {
  default: { default: 36, selected: 44 },
  large: { default: 72, selected: 88 },
};

/** Category-aware pin icon — image only, no white circle wrapper. */
export function createAnnouncementPinIcon(
  categorySlug: string,
  selected = false,
  pinSize: AnnouncementPinSize = "default",
): L.DivIcon {
  const color = getAnnouncementPinHex(categorySlug);
  const image = getAnnouncementPinImage(categorySlug);
  const size = PIN_SIZES[pinSize][selected ? "selected" : "default"];
  const shadow = selected
    ? "drop-shadow(0 0 0 4px rgba(154,82,255,0.35)) drop-shadow(0 2px 8px rgba(37,38,48,0.22))"
    : "drop-shadow(0 2px 8px rgba(37,38,48,0.22))";
  const fallbackHtml = `<div style="background:${color};width:${size - 8}px;height:${size - 8}px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(37,38,48,0.22);"></div>`;
  const html = image
    ? `<img src="${image}" alt="" width="${size}" height="${size}" style="width:${size}px;height:${size}px;object-fit:contain;display:block;filter:${shadow};" />`
    : fallbackHtml;

  return L.divIcon({
    className: "vl-map-pin !border-0 !bg-transparent",
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
}
