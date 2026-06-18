import { HandHeart, Megaphone, type LucideIcon } from "lucide-react";

export type { LucideIcon };

export const ANNOUNCEMENT_TYPES = [
  {
    slug: "demande",
    label: "Demande",
    Icon: Megaphone,
    gradient: "gradient-demande",
  },
  {
    slug: "offre",
    label: "Offre",
    Icon: HandHeart,
    gradient: "gradient-offre",
  },
] as const;

export type AnnouncementType = (typeof ANNOUNCEMENT_TYPES)[number]["slug"];

export type AnnouncementTypeGradient =
  (typeof ANNOUNCEMENT_TYPES)[number]["gradient"];

export type AnnouncementTypeConfig = (typeof ANNOUNCEMENT_TYPES)[number];

export const ANNOUNCEMENT_TYPE_SLUGS = ANNOUNCEMENT_TYPES.map(
  (t) => t.slug,
) as [AnnouncementType, ...AnnouncementType[]];

export function getAnnouncementTypeConfig(
  type: string,
): AnnouncementTypeConfig | undefined {
  return ANNOUNCEMENT_TYPES.find((t) => t.slug === type);
}

export function getAnnouncementTypeIcon(type: string): LucideIcon {
  return getAnnouncementTypeConfig(type)?.Icon ?? Megaphone;
}

export function getAnnouncementTypeLabel(type: string): string {
  return getAnnouncementTypeConfig(type)?.label ?? type;
}

export function isAnnouncementType(value: string): value is AnnouncementType {
  return ANNOUNCEMENT_TYPE_SLUGS.includes(value as AnnouncementType);
}
