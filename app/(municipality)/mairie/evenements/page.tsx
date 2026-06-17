import Link from "next/link";
import { requireCommuneStaff } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";
import { formatDay, formatEventRange } from "@/lib/utils/date";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategoryTag } from "@/components/ui/category-tag";
import { ContentTypeTag } from "@/components/ui/content-type-tag";
import { PageHeading } from "@/components/ui/page-heading";
import type { AgendaEventRecord } from "@/lib/types";

const PAGE_SIZE = 25;

export default async function MairieEvenementsPage(props: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { communeId } = await requireCommuneStaff();

  const { page } = await props.searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  const { data, count } = await supabase
    .from("events")
    .select("*", { count: "exact" })
    .eq("commune_id", communeId)
    .order("starts_at", { ascending: false })
    .range(from, to);

  const items = (data ?? []) as AgendaEventRecord[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(p: number) {
    return p > 1
      ? `${ROUTES.mairie.evenements}?page=${p}`
      : ROUTES.mairie.evenements;
  }

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-start justify-between gap-3 p-6">
        <div className="space-y-2">
          <PageHeading
            title="Événements"
            subtitle="Agenda communal animé par la mairie et les habitant·es."
          />
          <p className="text-xs font-medium text-muted">
            {total} événement{total > 1 ? "s" : ""} · page {currentPage} /{" "}
            {totalPages}
          </p>
        </div>
        <Button href={ROUTES.mairie.eventNew} className="text-xs">
          + Nouvel événement
        </Button>
      </Card>

      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm font-medium text-muted">
            Aucun événement pour l&apos;instant.
          </p>
        ) : (
          items.map((e) => (
            <Link key={e.id} href={ROUTES.mairie.evenementDetail(e.id)}>
              <Card className="space-y-2 p-4 transition hover:shadow-elevated">
                <div className="flex flex-wrap items-center gap-2">
                  <ContentTypeTag type="event" />
                  <CategoryTag
                    label={e.status === "active" ? "Actif" : "Archivé"}
                    className="bg-warm"
                  />
                </div>
                <p className="font-semibold text-text">{e.title}</p>
                <p className="text-xs font-medium text-muted">
                  {formatEventRange(e.starts_at, e.ends_at)}
                </p>
                <p className="text-[10px] font-medium text-subtle">
                  Créé le {formatDay(e.created_at)}
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
