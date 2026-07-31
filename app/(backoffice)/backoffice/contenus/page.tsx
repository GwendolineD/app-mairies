import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  BackofficeListLinkCard,
  BackofficeListPagination,
  BackofficeListResultCount,
} from "@/components/features/backoffice/backoffice-list-toolbar";
import { ContentCategoryBadge } from "@/components/features/backoffice/content-category-badge";
import { ContentStatusBadge } from "@/components/features/backoffice/content-status-badge";
import { ContentTypeBadge } from "@/components/features/backoffice/content-type-badge";
import { AnnouncementTypeTag } from "@/components/ui/announcement-type-tag";
import { Card } from "@/components/ui/card";
import { CategoryTag } from "@/components/ui/category-tag";
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";
import { isAnnouncementType } from "@/lib/constants/announcement-types";
import { ROUTES } from "@/lib/constants/routes";
import { formatShortDate } from "@/lib/datetime";
import { listPilotCommuneOptions } from "@/lib/queries/backoffice-communes";
import {
  countAllContentTypes,
  getContentPopulationStats,
  listContentCategoryOptions,
  listContenusPage,
} from "@/lib/queries/backoffice-contenus";
import { parseBackofficeContenusListParams } from "@/lib/utils/backoffice-contenus-params";
import { ContenusStatsChart } from "./_components/contenus-stats-chart";
import { ContenusToolbar } from "./_components/contenus-toolbar";

export const dynamic = "force-dynamic";

export default async function BackofficeContenusPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const params = parseBackofficeContenusListParams(searchParams);
  const supabase = await createClient();

  const [counts, communes] = await Promise.all([
    countAllContentTypes(supabase),
    listPilotCommuneOptions(supabase),
  ]);

  if (params.tab === "stats") {
    const stats = await getContentPopulationStats(supabase);

    return (
      <PageStack>
        <PageHeading title="Contenus" />
        <ContenusToolbar
          params={params}
          communes={communes}
          categories={[]}
          totalCount={0}
          counts={counts}
        />
        <ContenusStatsChart stats={stats} />
      </PageStack>
    );
  }

  const [{ items, totalCount }, categories] = await Promise.all([
    listContenusPage(supabase, params),
    listContentCategoryOptions(supabase, [params.tab]),
  ]);

  const listQueryProps = {
    params,
    queryVariant: "contenus" as const,
    totalCount,
    pageSize: params.limit,
  };

  return (
    <PageStack>
      <PageHeading title="Contenus" />

      <ContenusToolbar
        params={params}
        communes={communes}
        categories={categories}
        totalCount={totalCount}
        counts={counts}
      />

      <BackofficeListResultCount {...listQueryProps} />

      {items.length === 0 ? (
        <Card className="p-6 text-sm font-medium text-muted">
          Aucun contenu ne correspond à votre recherche.
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <BackofficeListLinkCard
              key={`${item.contentType}:${item.id}`}
              href={item.href}
              title={item.title}
              titleAside={
                <div className="flex flex-wrap items-center gap-2">
                  <ContentTypeBadge contentType={item.contentType} />
                  <ContentStatusBadge status={item.status} />
                  {item.suspended ? (
                    <CategoryTag
                      label="Suspendu"
                      className="bg-coral/10 text-coral"
                    />
                  ) : null}
                  {item.contentType === "event" && item.isOfficial ? (
                    <CategoryTag
                      label="Officiel"
                      className="bg-purple/10 text-purple"
                    />
                  ) : null}
                </div>
              }
              fields={[
                {
                  label: "Catégorie",
                  standalone: true,
                  value: (
                    <ContentCategoryBadge
                      contentType={item.contentType}
                      categorySlug={item.categorySlug}
                    />
                  ),
                },
                {
                  label: "Commune",
                  value: item.communeName,
                  href: ROUTES.backoffice.communeDetail(item.communeId),
                },
                ...(item.subtype && isAnnouncementType(item.subtype)
                  ? [
                      {
                        label: "Sous-type",
                        value: (
                          <AnnouncementTypeTag type={item.subtype} />
                        ),
                      },
                    ]
                  : []),
              ]}
              metaLeading={
                <p className="min-w-0 truncate">
                  <span className="text-subtle">Créé par</span>
                  {" · "}
                  {item.authorUserId ? (
                    <Link
                      href={ROUTES.backoffice.userDetail(item.authorUserId)}
                      className="text-text transition hover:text-purple"
                    >
                      {item.authorName}
                    </Link>
                  ) : (
                    <span className="text-text">{item.authorName}</span>
                  )}
                </p>
              }
              metaTrailing={
                <>
                  publié le{" "}
                  <span className="text-text">
                    {formatShortDate(item.createdAt)}
                  </span>
                </>
              }
            />
          ))}
        </div>
      )}

      <BackofficeListPagination {...listQueryProps} />
    </PageStack>
  );
}
