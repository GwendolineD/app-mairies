import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/** Count open support requests (new + in progress) for backoffice nav badge. */
export async function countOpenSupportRequests(
  supabase: SupabaseClient,
): Promise<number> {
  const { count, error } = await supabase
    .from("support_requests")
    .select("id", { count: "exact", head: true })
    .in("status", ["new", "in_progress"]);

  if (error || count === null) return 0;
  return count;
}

/** Deduped within a single RSC render (layout + page share one call). */
export const getCachedOpenSupportRequestsCount = cache(async () => {
  const supabase = await createClient();
  return countOpenSupportRequests(supabase);
});
