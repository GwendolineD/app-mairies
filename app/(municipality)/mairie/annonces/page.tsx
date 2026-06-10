import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { USER_ROLES } from "@/lib/constants/roles";
import { isAnnouncementType } from "@/lib/constants/announcement-types";
import { getCategoryLabel } from "@/lib/constants/announcement-categories";
import { createClient } from "@/lib/supabase/server";
import { formatDay } from "@/lib/utils/date";
import { AnnouncementTypeTag } from "@/components/ui/announcement-type-tag";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategoryTag } from "@/components/ui/category-tag";
import { PageHeading } from "@/components/ui/page-heading";
import type { Announcement } from "@/lib/types";

const PAGE_SIZE = 25;

const TYPE_FILTERS = [
  { key: "all", label: "Toutes" },
  { key: "demande", label: "Demandes" },
  { key: "offre", label: "Offres" },
] as const;

export default async function MairieAnnoncesPage(props: {
  searchParams: Promise<{ type?: string; page?: string }>;
}) {
  const ctx = await requireRole([USER_ROLES.municipalityStaff]);
  const communeId = ctx.profile.active_commune_id;
  if (!communeId) return null;

  const { type, page } = await props.searchParams;
  const typeFilter = type && isAnnouncementType(type) ? type : "all";
  const currentPage = Math.max(1, Number(page) || 1);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  let query = supabase
    .from("announcements")
    .select("*", { count: "exact" })
    .eq("commune_id", communeId);

  if (typeFilter !== "all") query = query.eq("type", typeFilter);

  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  const items = (data ?? []) as Announcement[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function buildHref(params: { type?: string; page?: number }) {
    const sp = new URLSearchParams();
    const t = params.type ?? typeFilter;
    if (t && t !== "all") sp.set("type", t);
    const p = params.page ?? currentPage;
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${ROUTES.mairie.annonces}?${qs}` : ROUTES.mairie.annonces;
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-4 p-6">
        <PageHeading
          title="Annonces"
          subtitle="Demandes et offres d'entraide publiées par les habitant·es de votre commune."
        />
        <div className="flex flex-wrap gap-2">
          {TYPE_FILTERS.map((f) => (
            <Button
              key={f.key}
              href={buildHref({ type: f.key, page: 1 })}
              variant={typeFilter === f.key ? "primary" : "secondary"}
              className="px-4 py-2 text-xs"
            >
              {f.label}
            </Button>
          ))}
        </div>
        <p className="text-xs font-medium text-muted">
          {total} annonce{total > 1 ? "s" : ""} · page {currentPage} /{" "}
          {totalPages}
        </p>
      </Card>

      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm font-medium text-muted">
            Aucune annonce pour ce filtre.
          </p>
        ) : (
          items.map((a) => (
            <Link key={a.id} href={ROUTES.mairie.annonceDetail(a.id)}>
              <Card className="space-y-2 p-4 transition hover:shadow-elevated">
                <div className="flex flex-wrap items-center gap-2">
                  <AnnouncementTypeTag type={a.type} />
                  <CategoryTag label={getCategoryLabel(a.category_slug)} />
                  <CategoryTag label={a.status} className="bg-warm" />
                </div>
                <p className="font-semibold text-text">{a.title}</p>
                <p className="text-[10px] font-medium text-subtle">
                  Publiée le {formatDay(a.created_at)}
                </p>
              </Card>
            </Link>
          ))
        )}
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <Button
            href={buildHref({ page: Math.max(1, currentPage - 1) })}
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
            href={buildHref({ page: Math.min(totalPages, currentPage + 1) })}
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
