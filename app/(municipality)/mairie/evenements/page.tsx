import { requireCommuneStaff } from "@/lib/auth/session";
import { EVENT_STATUS } from "@/lib/constants/statuses";
import { startOfTodayParisIso } from "@/lib/datetime";
import { createClient } from "@/lib/supabase/server";
import { MairieEvenementsPageClient } from "@/components/features/mairie-evenements-page-client";
import type { AgendaEventRecord } from "@/lib/types";

const PAGE_SIZE = 25;

type StatusFilter = "actives" | "toutes";

function resolveStatusFilter(value: string | undefined): StatusFilter {
  return value === "toutes" ? "toutes" : "actives";
}

export default async function MairieEvenementsPage(props: {
  searchParams: Promise<{ page?: string; statut?: string }>;
}) {
  const { communeId } = await requireCommuneStaff();
  if (!communeId) return null;

  const { page, statut } = await props.searchParams;
  const statusFilter = resolveStatusFilter(statut);
  const currentPage = Math.max(1, Number(page) || 1);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  let query = supabase
    .from("events")
    .select("*", { count: "exact" })
    .eq("commune_id", communeId)
    .eq("is_official", true);

  if (statusFilter === "actives") {
    query = query
      .eq("status", EVENT_STATUS.active)
      .is("suspended_at", null)
      .gte("ends_at", startOfTodayParisIso());
  }

  const { data, count } = await query
    .order("starts_at", { ascending: false })
    .range(from, to);

  const items = (data ?? []) as AgendaEventRecord[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <MairieEvenementsPageClient
      items={items}
      total={total}
      currentPage={currentPage}
      totalPages={totalPages}
      statusFilter={statusFilter}
    />
  );
}
