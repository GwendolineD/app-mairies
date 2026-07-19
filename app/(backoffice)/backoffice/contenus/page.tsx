import { createClient } from "@/lib/supabase/server";
import {
  BackofficeListLinkCard,
  BackofficeListPagination,
  BackofficeListResultCount,
} from "@/components/features/backoffice/backoffice-list-toolbar";
import { ContentTypeBadge } from "@/components/features/backoffice/content-type-badge";
import { AnnouncementTypeTag } from "@/components/ui/announcement-type-tag";
import { Card } from "@/components/ui/card";
import { CategoryTag } from "@/components/ui/category-tag";
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";
import { isAnnouncementType } from "@/lib/constants/announcement-types";
import { formatShortDate } from "@/lib/datetime";
import { listPilotCommuneOptions } from "@/lib/queries/backoffice-communes";
import {
  listContentCategoryOptions,
  listContenusPage,
} from "@/lib/queries/backoffice-contenus";
import { parseBackofficeContenusListParams } from "@/lib/utils/backoffice-contenus-params";
import { ContenusToolbar } from "./_components/contenus-toolbar";

export const dynamic = "force-dynamic";

export default async function BackofficeContenusPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const params = parseBackofficeContenusListParams(searchParams);
  const supabase = await createClient();

  const [{ items, totalCount }, communes, categories] = await Promise.all([
    listContenusPage(supabase, params),
    listPilotCommuneOptions(supabase),
    listContentCategoryOptions(supabase, params.types),
  ]);

  const listQueryProps = {
    params,
    queryVariant: "contenus" as const,
    totalCount,
    pageSize: params.limit,
  };

  return (
    <PageStack>
      <PageHeading
        title="Contenus"
        subtitle="Annonces, initiatives et événements publiés sur l'ensemble des communes pilotées."
      />

      <ContenusToolbar
        params={params}
        communes={communes}
        categories={categories}
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
                { label: "Commune", value: item.communeName },
                { label: "Statut", value: item.status },
                { label: "Catégorie", value: item.categoryLabel },
                { label: "Auteur·e", value: item.authorName },
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
