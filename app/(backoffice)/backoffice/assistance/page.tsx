import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";
import {
  BackofficeListPagination,
} from "@/components/features/backoffice/backoffice-list-toolbar";
import { Card } from "@/components/ui/card";
import { LinkifiedText } from "@/components/ui/linkified-text";
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";
import { Button } from "@/components/ui/button";
import { STAFF_REVIEW_STATUS_LABELS } from "@/lib/constants/staff-review-status";
import type { SupportRequestStatus } from "@/lib/types";
import { formatShortDate } from "@/lib/datetime";
import { listAssistancePage } from "@/lib/queries/backoffice-assistance";
import { listPilotCommuneOptions } from "@/lib/queries/backoffice-communes";
import {
  BACKOFFICE_ASSISTANCE_PAGE_SIZE,
  buildBackofficeAssistanceListQuery,
  buildClearAssistanceFiltersQuery,
  hasActiveAssistanceFilters,
  isBackofficeAssistanceUrlCanonical,
  parseBackofficeAssistanceListParams,
} from "@/lib/utils/backoffice-assistance-params";
import { AssistanceToolbar } from "./_components/assistance-toolbar";
import { BackofficeSupportActions } from "./_components/backoffice-support-actions";

export const dynamic = "force-dynamic";

function authorName(firstName: string | null, lastName: string | null): string {
  const parts = [firstName, lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Non renseigné";
}

export default async function BackofficeAssistancePage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePlatformAdmin();
  const rawSearchParams = await props.searchParams;

  if (!isBackofficeAssistanceUrlCanonical(rawSearchParams)) {
    const canonicalParams = parseBackofficeAssistanceListParams(rawSearchParams);
    redirect(
      `${ROUTES.backoffice.assistance}${buildBackofficeAssistanceListQuery(canonicalParams)}`,
    );
  }

  const params = parseBackofficeAssistanceListParams(rawSearchParams);
  const supabase = await createClient();

  const [{ items, totalCount }, communes] = await Promise.all([
    listAssistancePage(supabase, params),
    listPilotCommuneOptions(supabase),
  ]);

  const listQueryProps = {
    params,
    queryVariant: "assistance" as const,
    totalCount,
    pageSize: BACKOFFICE_ASSISTANCE_PAGE_SIZE,
  };

  const hasFilters = hasActiveAssistanceFilters(params);

  return (
    <PageStack>
      <PageHeading title="Assistance" />

      <AssistanceToolbar
        params={params}
        communes={communes}
        totalCount={totalCount}
      />

      <div className="space-y-3">
        {items.length === 0 ? (
          <Card className="rounded-xl p-6 text-center text-sm text-muted">
            {hasFilters ? (
              <div className="space-y-3">
                <p>Aucun résultat pour ces filtres.</p>
                <Button
                  render={
                    <Link
                      href={`${ROUTES.backoffice.assistance}${buildClearAssistanceFiltersQuery()}`}
                    />
                  }
                  variant="secondary"
                  size="sm"
                >
                  Effacer les filtres
                </Button>
              </div>
            ) : (
              <p>Aucune demande d&apos;assistance pour le moment.</p>
            )}
          </Card>
        ) : (
          items.map((request) => {
            const statusMeta =
              STAFF_REVIEW_STATUS_LABELS[request.status as SupportRequestStatus];
            const communeName = request.commune?.name ?? "–";
            const name = authorName(request.first_name, request.last_name);

            return (
              <Card key={request.id} className="space-y-3 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${statusMeta.className}`}
                    >
                      {statusMeta.label}
                    </span>
                    <span className="text-xs font-medium text-muted">
                      {communeName}
                    </span>
                  </div>
                  <span className="text-xs text-muted">
                    {formatShortDate(request.created_at)}
                  </span>
                </div>

                <p className="text-sm font-semibold text-text">{request.subject}</p>

                <LinkifiedText
                  text={request.message}
                  className="wrap-break-word whitespace-pre-wrap text-sm text-muted"
                />

                <p className="text-xs text-subtle">
                  {name} · {request.user_email}
                </p>

                <BackofficeSupportActions
                  requestId={request.id}
                  status={request.status as SupportRequestStatus}
                  initialComment={request.admin_comment}
                />
              </Card>
            );
          })
        )}
      </div>

      {totalCount > 0 ? (
        <BackofficeListPagination
          {...listQueryProps}
          limitOptions={[BACKOFFICE_ASSISTANCE_PAGE_SIZE]}
        />
      ) : null}
    </PageStack>
  );
}
