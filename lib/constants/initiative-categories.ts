/**
 * Initiative categories (fixed for all communes).
 */
export const INITIATIVE_CATEGORIES = [
  { slug: "solidarite", label: "Solidarité", colorToken: "coral" },
  { slug: "nature", label: "Nature", colorToken: "mint" },
  { slug: "culture", label: "Culture", colorToken: "purple" },
  { slug: "convivialite", label: "Convivialité", colorToken: "pink" },
  { slug: "sport", label: "Sport", colorToken: "orange" },
  { slug: "jeunesse", label: "Jeunesse", colorToken: "sun" },
] as const;

export type InitiativeCategorySlug =
  (typeof INITIATIVE_CATEGORIES)[number]["slug"];

export const INITIATIVE_CATEGORY_SLUGS = INITIATIVE_CATEGORIES.map(
  (c) => c.slug,
) as [InitiativeCategorySlug, ...InitiativeCategorySlug[]];

export function getInitiativeCategoryLabel(slug: string): string {
  return (
    INITIATIVE_CATEGORIES.find((c) => c.slug === slug)?.label ?? slug
  );
}
