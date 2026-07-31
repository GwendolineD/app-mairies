import type { SupabaseClient } from "@supabase/supabase-js";

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
