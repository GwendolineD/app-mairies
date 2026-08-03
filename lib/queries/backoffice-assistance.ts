import type { SupabaseClient } from "@supabase/supabase-js";
import type { SupportRequest } from "@/lib/types";
import type { BackofficeAssistanceListParams } from "@/lib/utils/backoffice-assistance-params";

function buildSearchOrFilter(query: string): string {
  const pattern = `%${query}%`;
  return [
    `subject.ilike.${pattern}`,
    `message.ilike.${pattern}`,
    `user_email.ilike.${pattern}`,
    `first_name.ilike.${pattern}`,
    `last_name.ilike.${pattern}`,
  ].join(",");
}

export async function listAssistancePage(
  supabase: SupabaseClient,
  params: BackofficeAssistanceListParams,
): Promise<{ items: SupportRequest[]; totalCount: number }> {
  const offset = (params.page - 1) * params.limit;
  const ascending = params.tri === "oldest";

  let countQuery = supabase
    .from("support_requests")
    .select("id", { count: "exact", head: true });

  let dataQuery = supabase
    .from("support_requests")
    .select("*, commune:communes!support_requests_commune_id_fkey(name)")
    .order("created_at", { ascending })
    .range(offset, offset + params.limit - 1);

  if (params.statuses.length > 0) {
    countQuery = countQuery.in("status", params.statuses);
    dataQuery = dataQuery.in("status", params.statuses);
  }

  if (params.commune) {
    countQuery = countQuery.eq("commune_id", params.commune);
    dataQuery = dataQuery.eq("commune_id", params.commune);
  }

  if (params.q) {
    const orFilter = buildSearchOrFilter(params.q);
    countQuery = countQuery.or(orFilter);
    dataQuery = dataQuery.or(orFilter);
  }

  const [{ count, error: countError }, { data, error: dataError }] =
    await Promise.all([countQuery, dataQuery]);

  if (countError || dataError || count === null) {
    return { items: [], totalCount: 0 };
  }

  return {
    items: (data ?? []) as SupportRequest[],
    totalCount: count,
  };
}
