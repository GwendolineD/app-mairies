import { requireCommuneStaff } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { MairieEvenementsPageClient } from "@/components/features/mairie-evenements-page-client";
import type { AgendaEventRecord } from "@/lib/types";

const PAGE_SIZE = 25;

export default async function MairieEvenementsPage(props: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { communeId } = await requireCommuneStaff();
  if (!communeId) return null;

  const { page } = await props.searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  const { data, count } = await supabase
    .from("events")
    .select("*", { count: "exact" })
    .eq("commune_id", communeId)
    .eq("is_official", true)
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
    />
  );
}
