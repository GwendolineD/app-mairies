/** Form state returned by backoffice category CRUD server actions. */
export type CategoryFormState = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export type InitiativeEventCategoryFormState = CategoryFormState;

/**
 * Standard result type for server actions.
 * All new actions should return ActionResult.
 * Existing actions will be migrated incrementally.
 */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export function ok(): ActionResult<void>;
export function ok<T>(data: T): ActionResult<T>;
export function ok<T>(data?: T): ActionResult<T> {
  return { success: true, data: data as T };
}

export function fail(
  error: string,
  fieldErrors?: Record<string, string[]>,
): ActionResult<never> {
  return { success: false, error, fieldErrors };
}
