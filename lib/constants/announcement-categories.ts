/**
 * Fixed announcement categories (same for all communes).
 * Icons and map pin assets: placeholders until provided by design.
 */
export const ANNOUNCEMENT_CATEGORIES = [
  { slug: "bricolage", label: "Bricolage" },
  { slug: "numerique", label: "Numérique" },
  { slug: "covoiturage", label: "Covoiturage" },
  { slug: "alimentaire", label: "Alimentaire" },
  { slug: "garde-pontuelle", label: "Garde pontuelle" },
  { slug: "administratif", label: "Administratif" },
  { slug: "animaux", label: "Animaux" },
  { slug: "jardinage", label: "Jardinage" },
  { slug: "pret-objet", label: "Prêt d'objet" },
  { slug: "don-troc", label: "Don / troc" },
  { slug: "autres", label: "Autres" },
] as const;

export type AnnouncementCategorySlug =
  (typeof ANNOUNCEMENT_CATEGORIES)[number]["slug"];

export function getCategoryLabel(slug: string): string {
  return (
    ANNOUNCEMENT_CATEGORIES.find((c) => c.slug === slug)?.label ?? slug
  );
}
