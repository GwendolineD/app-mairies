"use server";

import { ROUTES } from "@/lib/constants/routes";
import { ANNOUNCEMENT_CATEGORIES_CACHE_TAG } from "@/lib/queries/announcement-categories";
import type { CategoryFormState } from "@/lib/actions/types";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryUsageCount,
} from "./category-crud";

const CONFIG = {
  table: "announcement_categories",
  cacheTag: ANNOUNCEMENT_CATEGORIES_CACHE_TAG,
  revalidatePaths: [ROUTES.backoffice.categories],
  usageTables: ["announcements"],
  logPrefix: "announcement-categories",
} as const;

export async function createAnnouncementCategory(
  prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  return createCategory(CONFIG, prev, formData);
}

export async function updateAnnouncementCategory(
  slug: string,
  prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  return updateCategory(CONFIG, slug, prev, formData);
}

export async function deleteAnnouncementCategory(
  slug: string,
): Promise<CategoryFormState> {
  return deleteCategory(CONFIG, slug);
}

export async function getAnnouncementCountByCategory(
  slug: string,
): Promise<number> {
  return getCategoryUsageCount(CONFIG, slug);
}
