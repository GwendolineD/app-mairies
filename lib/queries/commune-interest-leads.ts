import type { SupabaseClient } from "@supabase/supabase-js";

/** Count open commune interest leads (new + in progress) for backoffice nav badge. */
export async function countOpenCommuneInterestLeads(
  supabase: SupabaseClient,
): Promise<number> {
  const { count, error } = await supabase
    .from("commune_interest_leads")
    .select("id", { count: "exact", head: true })
    .in("status", ["new", "in_progress"]);

  if (error || count === null) return 0;
  return count;
}
