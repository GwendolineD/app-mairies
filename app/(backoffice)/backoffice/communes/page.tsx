import { createClient } from "@/lib/supabase/server";
import { AddCommuneButton } from "@/components/features/backoffice/add-commune-button";
import {
  BackofficeListFilters,
  BackofficeListLinkCard,
  BackofficeListPagination,
  BackofficeListResultCount,
} from "@/components/features/backoffice/backoffice-list-toolbar";
import { AccessStatusBadge } from "@/components/features/backoffice/access-status-badge";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";
import { ALL_ACCESS_STATUSES, ACCESS_STATUS_LABELS } from "@/lib/constants/access-status";
import { ROUTES } from "@/lib/constants/routes";
import { listPilotCommunesPage } from "@/lib/queries/backoffice-communes";
import { formatShortDate } from "@/lib/utils/format-date";
import { parseBackofficeCommunesListParams } from "@/lib/utils/backoffice-search-params";

export const dynamic = "force-dynamic";

export default async function BackofficeCommunesPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const params = parseBackofficeCommunesListParams(searchParams);
  const supabase = await createClient();
  const { items, totalCount } = await listPilotCommunesPage(supabase, params);

  const listQueryProps = {
    params,
    queryVariant: "communes" as const,
    totalCount,
    pageSize: params.limit,
  };

  return (
    <PageStack>
      <PageHeading title="Communes pilotées" actions={<AddCommuneButton />} />

      <BackofficeListFilters
        {...listQueryProps}
        searchPlaceholder="Rechercher par nom ou code postal"
        statusMultiSelect
        statusOptions={ALL_ACCESS_STATUSES.map((status) => ({
          value: status,
          label: ACCESS_STATUS_LABELS[status],
        }))}
      />

      <BackofficeListResultCount {...listQueryProps} />

      {items.length === 0 ? (
        <Card className="p-6 text-sm font-medium text-muted">
          Aucune commune pilotée ne correspond à votre recherche.
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((commune) => (
            <BackofficeListLinkCard
              key={commune.id}
              href={ROUTES.backoffice.communeDetail(commune.id)}
              title={
                <>
                  {commune.name}
                  {commune.postcode ? (
                    <span className="font-medium text-muted">
                      {" "}
                      ({commune.postcode})
                    </span>
                  ) : null}
                </>
              }
              titleAside={
                <AccessStatusBadge status={commune.access_status} />
              }
              fields={[
                { label: "Adhérent·es", value: commune.activeMembersCount },
                { label: "Annonces", value: commune.activeAnnouncementsCount },
                { label: "Initiatives", value: commune.activeInitiativesCount },
                { label: "Événements", value: commune.activeEventsCount },
              ]}
              metaTrailing={
                <>
                  créé le{" "}
                  <span className="text-text">
                    {formatShortDate(commune.created_at)}
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
