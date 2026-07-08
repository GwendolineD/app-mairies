import Link from "next/link";
import { requireCommuneStaff } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { INITIATIVE_STATUS } from "@/lib/constants/statuses";
import { createClient } from "@/lib/supabase/server";
import { formatDay } from "@/lib/datetime";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategoryTag } from "@/components/ui/category-tag";
import { ContentTypeTag } from "@/components/ui/content-type-tag";
import { PageHeading } from "@/components/ui/page-heading";
import type { InitiativeRecord } from "@/lib/types";

const PAGE_SIZE = 25;

const STATUS_FILTERS = [
  { key: "actives", label: "Actives" },
  { key: "toutes", label: "Toutes" },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]["key"];

function resolveStatusFilter(value: string | undefined): StatusFilter {
  return value === "toutes" ? "toutes" : "actives";
}

export default async function MairieInitiativesPage(props: {
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
    .from("initiatives")
    .select("*", { count: "exact" })
    .eq("commune_id", communeId);

  if (statusFilter === "actives") {
    query = query
      .eq("status", INITIATIVE_STATUS.active)
      .is("suspended_at", null);
  }

  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  const items = (data ?? []) as InitiativeRecord[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(p: number, nextStatus: StatusFilter = statusFilter) {
    const sp = new URLSearchParams();
    if (p > 1) sp.set("page", String(p));
    if (nextStatus !== "actives") sp.set("statut", nextStatus);
    const qs = sp.toString();
    return qs
      ? `${ROUTES.mairie.initiatives}?${qs}`
      : ROUTES.mairie.initiatives;
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-2 p-6">
        <PageHeading
          title="Initiatives"
          subtitle="Projets collectifs portés par les habitant·es de votre commune."
        />
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <Button
              key={f.key}
              href={pageHref(1, f.key)}
              variant={statusFilter === f.key ? "primary" : "secondary"}
              className="px-4 py-2 text-xs"
            >
              {f.label}
            </Button>
          ))}
        </div>
        <p className="text-xs font-medium text-muted">
          {total} initiative{total > 1 ? "s" : ""}
          {statusFilter === "actives"
            ? ` active${total > 1 ? "s" : ""}`
            : ""}{" "}
          · page {currentPage} / {totalPages}
        </p>
      </Card>

      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm font-medium text-muted">
            Aucune initiative pour l&apos;instant.
          </p>
        ) : (
          items.map((i) => (
            <Link key={i.id} href={ROUTES.mairie.initiativeDetail(i.id)}>
              <Card className="space-y-2 p-4 transition hover:shadow-elevated">
                <div className="flex flex-wrap items-center gap-2">
                  <ContentTypeTag type="initiative" />
                  <CategoryTag
                    label={i.status === "active" ? "Active" : "Archivée"}
                    className="bg-warm"
                  />
                </div>
                <p className="font-semibold text-text">{i.title}</p>
                <p className="text-[10px] font-medium text-subtle">
                  Créée le {formatDay(i.created_at)}
                </p>
              </Card>
            </Link>
          ))
        )}
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <Button
            href={pageHref(Math.max(1, currentPage - 1))}
            variant="secondary"
            className={
              currentPage <= 1
                ? "pointer-events-none px-4 py-2 text-xs opacity-50"
                : "px-4 py-2 text-xs"
            }
          >
            ← Précédent
          </Button>
          <Button
            href={pageHref(Math.min(totalPages, currentPage + 1))}
            variant="secondary"
            className={
              currentPage >= totalPages
                ? "pointer-events-none px-4 py-2 text-xs opacity-50"
                : "px-4 py-2 text-xs"
            }
          >
            Suivant →
          </Button>
        </div>
      ) : null}
    </div>
  );
}
