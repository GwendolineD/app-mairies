import {
  getInitiativeCategoryLabel,
  INITIATIVE_CATEGORIES,
} from "@/lib/constants/initiative-categories";

export function getContentCategoryLabel(slug: string | null): string {
  return getInitiativeCategoryLabel(slug ?? "solidarite");
}

export const CONTENT_CATEGORIES = INITIATIVE_CATEGORIES;
