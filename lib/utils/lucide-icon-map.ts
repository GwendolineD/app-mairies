import {
  Car,
  FileText,
  Gift,
  Hammer,
  Leaf,
  Monitor,
  MoreHorizontal,
  Music,
  Package,
  PawPrint,
  ShoppingBasket,
  Users,
  type LucideIcon,
} from "lucide-react";

export type { LucideIcon };
export { MoreHorizontal };

/**
 * Static map of allowed icon names to Lucide components.
 * Tree-shake friendly: only these 12 icons are bundled.
 * Extend this map when adding new category icons in the backoffice.
 */
export const LUCIDE_ICON_MAP: Record<string, LucideIcon> = {
  hammer: Hammer,
  monitor: Monitor,
  car: Car,
  "shopping-basket": ShoppingBasket,
  users: Users,
  "file-text": FileText,
  "paw-print": PawPrint,
  leaf: Leaf,
  package: Package,
  gift: Gift,
  music: Music,
  "more-horizontal": MoreHorizontal,
};

/**
 * Resolve an icon_name string from DB to a Lucide component.
 * Falls back to MoreHorizontal if name is null or not in the map.
 */
export function resolveIcon(name: string | null): LucideIcon {
  return (name && LUCIDE_ICON_MAP[name]) ?? MoreHorizontal;
}

/** List of allowed icon names for the backoffice picker. */
export const ALLOWED_ICON_NAMES = Object.keys(LUCIDE_ICON_MAP);
