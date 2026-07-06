import type { PostgrestError } from "@supabase/supabase-js";

type SupabaseResult<T> = {
  data: T | null;
  error: PostgrestError | null;
};

/**
 * Unwraps a Supabase query result, throwing on error or null data.
 * Thrown errors are caught by Next.js error boundaries (error.tsx).
 * Internal messages are in English (for logs); user-facing messages
 * are handled by the error boundary in French.
 */
export function unwrapOrThrow<T>(
  result: SupabaseResult<T>,
  context: string,
): T {
  if (result.error) {
    throw new Error(`[${context}] ${result.error.message}`);
  }
  if (result.data == null) {
    throw new Error(`[${context}] No data returned`);
  }
  return result.data;
}
