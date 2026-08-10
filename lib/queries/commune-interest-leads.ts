import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { LeadsListParams } from "@/lib/utils/backoffice-leads-params";
import type { Database } from "@/lib/types/database.types";

type CommuneInterestLeadRow =
  Database["public"]["Tables"]["commune_interest_leads"]["Row"];

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

/** Deduped within a single RSC render (layout + page share one call). */
export const getCachedOpenLeadsCount = cache(async () => {
  const supabase = await createClient();
  return countOpenCommuneInterestLeads(supabase);
});

export async function listLeadsPage(
  supabase: SupabaseClient,
  params: LeadsListParams,
): Promise<{ items: CommuneInterestLeadRow[]; totalCount: number }> {
  const offset = (params.page - 1) * params.limit;

  const { data, count, error } = await supabase
    .from("commune_interest_leads")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + params.limit - 1);

  if (error) {
    return { items: [], totalCount: 0 };
  }

  return {
    items: data ?? [],
    totalCount: count ?? 0,
  };
}
