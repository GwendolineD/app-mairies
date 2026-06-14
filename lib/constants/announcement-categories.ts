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
 * Single source of truth for labels, map/UI colors, icons, and default photos.
 */
export const ANNOUNCEMENT_CATEGORIES = [
  {
    slug: "bricolage",
    label: "Bricolage",
    colorHex: "#E85D3A",
    Icon: Hammer,
    defaultPhotoUrl:
      "https://res.cloudinary.com/du3ko16j1/image/upload/v1781280253/app-mairies/illustrations/annonce-categorie-image-default/bricolage_2_xgz7dd.png",
  },
  {
    slug: "numerique",
    label: "Numérique",
    colorHex: "#5CBDB9",
    Icon: Monitor,
    defaultPhotoUrl:
      "https://res.cloudinary.com/du3ko16j1/image/upload/v1781280255/app-mairies/illustrations/annonce-categorie-image-default/numerique_2_bqxjvf.png",
  },
  {
    slug: "transport",
    label: "Transport",
    colorHex: "#4A9FD4",
    Icon: Car,
    defaultPhotoUrl:
      "https://res.cloudinary.com/du3ko16j1/image/upload/v1781280256/app-mairies/illustrations/annonce-categorie-image-default/transport_2_thbebj.png",
  },
  {
    slug: "alimentaire",
    label: "Alimentaire",
    colorHex: "#F4A261",
    Icon: ShoppingBasket,
    defaultPhotoUrl:
      "https://res.cloudinary.com/du3ko16j1/image/upload/v1781280252/app-mairies/illustrations/annonce-categorie-image-default/alimentaire_-_Moyenne_sjiy1u.png",
  },
  {
    slug: "garde-pontuelle",
    label: "Garde ponctuelle",
    colorHex: "#E89AB8",
    Icon: Users,
    defaultPhotoUrl:
      "https://res.cloudinary.com/du3ko16j1/image/upload/v1781280254/app-mairies/illustrations/annonce-categorie-image-default/garde-enfants_2_ilgrha.png",
  },
  {
    slug: "paperasse",
    label: "Paperasse",
    colorHex: "#E8C07A",
    Icon: FileText,
    defaultPhotoUrl:
      "https://res.cloudinary.com/du3ko16j1/image/upload/v1781280256/app-mairies/illustrations/annonce-categorie-image-default/paperasse_2_jlabjc.png",
  },
  {
    slug: "animaux",
    label: "Animaux",
    colorHex: "#B58463",
    Icon: PawPrint,
    defaultPhotoUrl:
      "https://res.cloudinary.com/du3ko16j1/image/upload/v1781280252/app-mairies/illustrations/annonce-categorie-image-default/animaux_-_Moyenne_grssuv.png",
  },
  {
    slug: "jardinage-exterieur",
    label: "Jardinage & extérieur",
    colorHex: "#7BB661",
    Icon: Leaf,
    defaultPhotoUrl:
      "https://res.cloudinary.com/du3ko16j1/image/upload/v1781280254/app-mairies/illustrations/annonce-categorie-image-default/jardin-exterieur_2_etmein.png",
  },
  {
    slug: "pret-objet",
    label: "Prêt d'objet",
    colorHex: "#8FA8C9",
    Icon: Package,
    defaultPhotoUrl:
      "https://res.cloudinary.com/du3ko16j1/image/upload/v1781280256/app-mairies/illustrations/annonce-categorie-image-default/pret-objet_2_emrbqp.png",
  },
  {
    slug: "don-troc",
    label: "Don & troc",
    colorHex: "#B084CC",
    Icon: Gift,
    defaultPhotoUrl:
      "https://res.cloudinary.com/du3ko16j1/image/upload/v1781280253/app-mairies/illustrations/annonce-categorie-image-default/don-troc_2_jeqxql.png",
  },
  {
    slug: "loisirs",
    label: "Loisirs",
    colorHex: "#E8688F",
    Icon: Music,
    defaultPhotoUrl:
      "https://res.cloudinary.com/du3ko16j1/image/upload/v1781280255/app-mairies/illustrations/annonce-categorie-image-default/loisirs_2_hvzfoe.png",
  },
  {
    slug: "autre",
    label: "Autre",
    colorHex: "#A8A8A8",
    Icon: MoreHorizontal,
    defaultPhotoUrl:
      "https://res.cloudinary.com/du3ko16j1/image/upload/v1781280253/app-mairies/illustrations/annonce-categorie-image-default/autre_2_s1dc51.png",
  },
] as const satisfies ReadonlyArray<{
  slug: string;
  label: string;
  colorHex: string;
  Icon: LucideIcon;
  defaultPhotoUrl: string;
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

export function getCategoryDefaultPhotoUrl(slug: string): string {
  return (
    getCategoryBySlug(slug)?.defaultPhotoUrl ??
    getCategoryBySlug("autre")!.defaultPhotoUrl
  );
}
