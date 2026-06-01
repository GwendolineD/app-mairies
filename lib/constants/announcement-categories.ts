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

/**
 * Fixed announcement categories (same for all communes).
 * Single source of truth for labels, map/UI colors, and icons.
 */
export const ANNOUNCEMENT_CATEGORIES = [
  { slug: "bricolage", label: "Bricolage", colorHex: "#E85D3A", Icon: Hammer },
  { slug: "numerique", label: "Numérique", colorHex: "#5CBDB9", Icon: Monitor },
  { slug: "transport", label: "Transport", colorHex: "#4A9FD4", Icon: Car },
  { slug: "alimentaire", label: "Alimentaire", colorHex: "#F4A261", Icon: ShoppingBasket },
  { slug: "garde-pontuelle", label: "Garde ponctuelle", colorHex: "#E89AB8", Icon: Users },
  { slug: "paperasse", label: "Paperasse", colorHex: "#E8C07A", Icon: FileText },
  { slug: "animaux", label: "Animaux", colorHex: "#B58463", Icon: PawPrint },
  {
    slug: "jardinage-exterieur",
    label: "Jardinage & extérieur",
    colorHex: "#7BB661",
    Icon: Leaf,
  },
  { slug: "pret-objet", label: "Prêt d'objet", colorHex: "#8FA8C9", Icon: Package },
  { slug: "don-troc", label: "Don & troc", colorHex: "#B084CC", Icon: Gift },
  { slug: "loisirs", label: "Loisirs", colorHex: "#E8688F", Icon: Music },
  { slug: "autre", label: "Autre", colorHex: "#A8A8A8", Icon: MoreHorizontal },
] as const satisfies ReadonlyArray<{
  slug: string;
  label: string;
  colorHex: string;
  Icon: LucideIcon;
}>;

export type AnnouncementCategorySlug =
  (typeof ANNOUNCEMENT_CATEGORIES)[number]["slug"];

export type AnnouncementCategory = (typeof ANNOUNCEMENT_CATEGORIES)[number];

export const ANNOUNCEMENT_CATEGORY_SLUGS = ANNOUNCEMENT_CATEGORIES.map(
  (c) => c.slug,
) as [AnnouncementCategorySlug, ...AnnouncementCategorySlug[]];

const bySlug = new Map(
  ANNOUNCEMENT_CATEGORIES.map((c) => [c.slug, c] as const),
);

/** @deprecated Use ANNOUNCEMENT_CATEGORY_SLUGS */
export const categorySlugs = ANNOUNCEMENT_CATEGORY_SLUGS;

export function getCategoryBySlug(slug: string): AnnouncementCategory | undefined {
  return bySlug.get(slug as AnnouncementCategorySlug);
}

export function getCategoryLabel(slug: string): string {
  return getCategoryBySlug(slug)?.label ?? slug;
}

export function getCategoryColorHex(slug: string): string {
  return getCategoryBySlug(slug)?.colorHex ?? "#A8A8A8";
}

export function getCategoryIcon(slug: string): LucideIcon {
  return getCategoryBySlug(slug)?.Icon ?? MoreHorizontal;
}
