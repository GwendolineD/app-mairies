import type { SupabaseClient } from "@supabase/supabase-js";
import type { BackofficeAuditListParams } from "@/lib/utils/audit-search-params";

export type AuditLogRow = {
  id: string;
  created_at: string;
  user_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  device_type: string | null;
  os_name: string | null;
  os_version: string | null;
  browser_name: string | null;
  action: string;
  category: string;
  severity: string;
  target_type: string | null;
  target_id: string | null;
  commune_id: string | null;
  metadata: Record<string, unknown>;
  success: boolean;
  actor_display_name: string | null;
  commune_name: string | null;
};

export async function listAuditLogsPage(
  supabase: SupabaseClient,
  params: BackofficeAuditListParams,
): Promise<{ items: AuditLogRow[]; totalCount: number }> {
  const offset = (params.page - 1) * params.limit;

  let countQuery = supabase
    .from("audit_logs")
    .select("id", { count: "exact", head: true });

  let dataQuery = supabase
    .from("audit_logs")
    .select(
      "id, created_at, user_id, ip_address, user_agent, device_type, os_name, os_version, browser_name, action, category, severity, target_type, target_id, commune_id, metadata, success",
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + params.limit - 1);

  if (params.category) {
    countQuery = countQuery.eq("category", params.category);
    dataQuery = dataQuery.eq("category", params.category);
  }
  if (params.severity) {
    countQuery = countQuery.eq("severity", params.severity);
    dataQuery = dataQuery.eq("severity", params.severity);
  }
  if (params.deviceType) {
    countQuery = countQuery.eq("device_type", params.deviceType);
    dataQuery = dataQuery.eq("device_type", params.deviceType);
  }
  if (params.dateFrom) {
    const from = `${params.dateFrom}T00:00:00.000Z`;
    countQuery = countQuery.gte("created_at", from);
    dataQuery = dataQuery.gte("created_at", from);
  }
  if (params.dateTo) {
    const to = `${params.dateTo}T23:59:59.999Z`;
    countQuery = countQuery.lte("created_at", to);
    dataQuery = dataQuery.lte("created_at", to);
  }
  if (params.q) {
    const pattern = `%${params.q}%`;
    const orFilter = `action.ilike.${pattern},target_id.ilike.${pattern},target_type.ilike.${pattern}`;
    countQuery = countQuery.or(orFilter);
    dataQuery = dataQuery.or(orFilter);
  }

  const [{ count }, { data, error }] = await Promise.all([countQuery, dataQuery]);

  if (error) {
    return { items: [], totalCount: 0 };
  }

  const rows = data ?? [];
  const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))] as string[];
  const communeIds = [
    ...new Set(rows.map((r) => r.commune_id).filter(Boolean)),
  ] as string[];

  const profileMap: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, first_name, last_name")
      .in("user_id", userIds);
    for (const p of profiles ?? []) {
      profileMap[p.user_id] =
        (p.display_name ??
          [p.first_name, p.last_name].filter(Boolean).join(" ")) ||
        "Utilisateur";
    }
  }

  const communeMap: Record<string, string> = {};
  if (communeIds.length > 0) {
    const { data: communes } = await supabase
      .from("communes")
      .select("id, name")
      .in("id", communeIds);
    for (const c of communes ?? []) {
      communeMap[c.id] = c.name;
    }
  }

  const items: AuditLogRow[] = rows.map((row) => ({
    ...row,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    actor_display_name: row.user_id ? profileMap[row.user_id] ?? null : null,
    commune_name: row.commune_id ? communeMap[row.commune_id] ?? null : null,
  }));

  return { items, totalCount: count ?? 0 };
}
