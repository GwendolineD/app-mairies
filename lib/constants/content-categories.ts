/**
 * Shared community categories for initiatives and events.
 * Kept in sync with the `content_categories` lookup table (see migration
 * 20260605000000_initiatives_categories_location.sql).
 */
export const CONTENT_CATEGORIES = [
  { slug: "solidarite", label: "Solidarité" },
  { slug: "nature", label: "Nature" },
  { slug: "culture", label: "Culture" },
  { slug: "convivialite", label: "Convivialité" },
  { slug: "sport", label: "Sport" },
  { slug: "jeunesse", label: "Jeunesse" },
  { slug: "seniors", label: "Seniors" },
  { slug: "numerique", label: "Numérique" },
  { slug: "intergenerationnel", label: "Intergénérationnel" },
  { slug: "mobilite", label: "Mobilité" },
  { slug: "citoyennete", label: "Citoyenneté" },
  { slug: "autre", label: "Autre" },
] as const;

export type ContentCategorySlug = (typeof CONTENT_CATEGORIES)[number]["slug"];

export const CONTENT_CATEGORY_SLUGS = CONTENT_CATEGORIES.map((c) => c.slug) as [
  ContentCategorySlug,
  ...ContentCategorySlug[],
];

export const DEFAULT_CONTENT_CATEGORY: ContentCategorySlug = "autre";

export function getContentCategoryLabel(slug: string): string {
  return CONTENT_CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}
