import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/** Count pending reports scoped to a commune (mairie). */
export async function countPendingReports(
  supabase: SupabaseClient,
  communeId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("commune_id", communeId)
    .eq("status", "pending");

  if (error || count === null) return 0;
  return count;
}

/** Count all pending reports across all communes (backoffice). */
export async function countAllPendingReports(
  supabase: SupabaseClient,
): Promise<number> {
  const { count, error } = await supabase
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  if (error || count === null) return 0;
  return count;
}

/** Deduped within a single RSC render (layout + page share one call). */
export const getCachedAllPendingReportsCount = cache(async () => {
  const supabase = await createClient();
  return countAllPendingReports(supabase);
});
