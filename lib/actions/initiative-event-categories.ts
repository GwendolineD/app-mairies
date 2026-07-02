"use server";

import { ROUTES } from "@/lib/constants/routes";
import { INITIATIVE_EVENT_CATEGORIES_CACHE_TAG } from "@/lib/queries/initiative-event-categories";
import type { InitiativeEventCategoryFormState } from "@/lib/actions/types";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "./category-crud";

const CONFIG = {
  table: "initiative_event_categories",
  cacheTag: INITIATIVE_EVENT_CATEGORIES_CACHE_TAG,
  revalidatePaths: [ROUTES.backoffice.categoriesInitiatives],
  usageTables: ["initiatives", "events"],
  logPrefix: "initiative-event-categories",
} as const;

export async function createInitiativeEventCategory(
  prev: InitiativeEventCategoryFormState,
  formData: FormData,
): Promise<InitiativeEventCategoryFormState> {
  return createCategory(CONFIG, prev, formData);
}

export async function updateInitiativeEventCategory(
  slug: string,
  prev: InitiativeEventCategoryFormState,
  formData: FormData,
): Promise<InitiativeEventCategoryFormState> {
  return updateCategory(CONFIG, slug, prev, formData);
}

export async function deleteInitiativeEventCategory(
  slug: string,
): Promise<InitiativeEventCategoryFormState> {
  return deleteCategory(CONFIG, slug);
}
