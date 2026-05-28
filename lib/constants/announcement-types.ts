export const ANNOUNCEMENT_TYPES = [
  { slug: "demande", label: "Demande" },
  { slug: "offre", label: "Offre" },
] as const;

export type AnnouncementType = (typeof ANNOUNCEMENT_TYPES)[number]["slug"];

export const ANNOUNCEMENT_TYPE_SLUGS = ANNOUNCEMENT_TYPES.map(
  (t) => t.slug,
) as [AnnouncementType, ...AnnouncementType[]];

export function getAnnouncementTypeLabel(type: string): string {
  return (
    ANNOUNCEMENT_TYPES.find((t) => t.slug === type)?.label ?? type
  );
}

export function isAnnouncementType(value: string): value is AnnouncementType {
  return ANNOUNCEMENT_TYPE_SLUGS.includes(value as AnnouncementType);
}
