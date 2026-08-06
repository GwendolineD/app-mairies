import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";
import { formatCompactShortDate } from "@/lib/datetime";
import { formatDisplayName } from "@/lib/utils/display-name";
import {
  buildReportListQuery,
  getReportContextLabel,
  hasActiveReportFilters,
  isReportListUrlCanonical,
  parseReportListParams,
} from "@/lib/utils/report-list-params";
import { ReportResolutionBadge } from "@/components/features/reports/report-resolution-badge";
import { ReportActionsClient } from "@/components/features/reports/report-actions-client";
import { ReportRestoreStatus } from "@/components/features/reports/report-restore-status";
import { ReportContextPastille } from "@/components/features/reports/report-context-pastille";
import { ReportListToolbar } from "@/components/features/reports/report-list-toolbar";
import { ReportRelatedCountLink } from "@/components/features/reports/report-related-count-link";
import { ReportListPagination } from "@/components/features/reports/report-list-pagination";
import { MultilineText } from "@/components/ui/multiline-text";
import { getReportResolutionMeta } from "@/lib/queries/report-resolution-meta";
import { getReportRestoreContext } from "@/lib/queries/report-restore-context";
import { getSignalementsPageData } from "@/lib/queries/backoffice-signalements";

export const dynamic = "force-dynamic";

function contextLink(contextType: string, contextId: string): string | null {
  if (contextType === "announcement") return ROUTES.annonces.detail(contextId);
  if (contextType === "initiative") return ROUTES.initiatives.detail(contextId);
  if (contextType === "event") return ROUTES.evenements.detail(contextId);
  return null;
}

function resolveReporterName(profile: {
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
} | null | undefined): string {
  if (profile?.first_name && profile?.last_name) {
    return formatDisplayName(profile.first_name, profile.last_name);
  }
  return profile?.display_name ?? "Inconnu";
}

export default async function BackofficeSignalementsPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { userId } = await requirePlatformAdmin();
  const rawSearchParams = await props.searchParams;

  if (!isReportListUrlCanonical(rawSearchParams)) {
    const canonicalParams = parseReportListParams(rawSearchParams);
    redirect(
      `${ROUTES.backoffice.signalements}${buildReportListQuery(canonicalParams)}`,
    );
  }

  const listParams = parseReportListParams(rawSearchParams);
  const supabase = await createClient();
  const {
    filteredReports,
    totalCount,
    titleMap,
    authorMembershipIdMap,
    announcementTypeMap,
    contentSuspensionReasonById,
    authorUserIdMap,
    authorNameByMembershipId,
    resolutionMetaMaps,
    restoreContextMaps,
    restoredByNameMap,
    reportCountByContext,
    resolveUserReportMembershipId,
  } = await getSignalementsPageData(supabase, listParams);

  return (
    <PageStack>
      <PageHeading
        title="Signalements (Plateforme)"
        subtitle="Tous les signalements de toutes les communes."
      />

      <ReportListToolbar params={listParams} totalCount={totalCount} />

      <div className="space-y-3">
        {filteredReports.length === 0 ? (
          <Card className="rounded-2xl p-6 text-center text-sm text-muted">
            {hasActiveReportFilters(listParams)
              ? listParams.q
                ? "Aucun signalement ne correspond à votre recherche."
                : "Aucun signalement ne correspond à ces filtres."
              : "Aucun signalement pour le moment."}
            {hasActiveReportFilters(listParams) ? (
              <>
                {" "}
                <Link
                  href={`${ROUTES.backoffice.signalements}${buildReportListQuery({
                    tri: listParams.tri,
                    statuses: ["pending"],
                    contentTypes: [],
                    q: "",
                    page: 1,
                    limit: listParams.limit,
                  })}`}
                  className="font-semibold text-purple hover:underline"
                >
                  Réinitialiser les filtres
                </Link>
              </>
            ) : null}
          </Card>
        ) : (
          filteredReports.map((report) => {
            const reporterProfile = report.reporter_membership?.profiles;
            const reporterName = resolveReporterName(reporterProfile);
            const contentTitle = titleMap[report.context_id] ?? null;
            const communeName = report.commune?.name ?? "–";
            const link = contextLink(report.context_type, report.context_id);
            const isPending = report.status === "pending";

            const authorMembershipId =
              report.context_type === "user"
                ? resolveUserReportMembershipId(report)
                : authorMembershipIdMap[report.context_id] ?? null;
            const isAuthorSelf = authorMembershipId
              ? authorUserIdMap[authorMembershipId] === userId
              : false;

            const contextKey = `${report.context_type}:${report.context_id}`;
            const relatedCount = reportCountByContext.get(contextKey) ?? 1;
            const contextLabel = getReportContextLabel(report.context_type);
            const showRelatedLink =
              relatedCount > 1 && contentTitle && contextLabel !== null;
            const restoredByUserId = report.restored_by_user_id;
            const restoredAt = report.restored_at;
            const resolutionMeta = getReportResolutionMeta(
              report,
              authorMembershipId,
              resolutionMetaMaps,
            );
            const restoreContext = getReportRestoreContext(
              {
                resolution: report.resolution,
                context_type: report.context_type,
                context_id: report.context_id,
                restored_at: restoredAt,
                restored_by_name: restoredByUserId
                  ? restoredByNameMap[restoredByUserId] ?? "Modérateur"
                  : null,
              },
              authorMembershipId,
              restoreContextMaps,
            );

            return (
              <Card key={report.id} className="gap-3 rounded-2xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {contentTitle ? (
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <ReportContextPastille
                        contextType={report.context_type}
                        announcementType={announcementTypeMap[report.context_id]}
                      />
                      <p className="text-sm font-semibold text-text">
                        {contentTitle}
                        {link && (
                          <Link
                            href={link}
                            className="ml-2 text-xs font-medium text-purple hover:underline"
                          >
                            Voir →
                          </Link>
                        )}
                      </p>
                    </div>
                  ) : report.context_type !== "user" ? (
                    <span className="rounded-full bg-warm px-2.5 py-0.5 text-xs font-semibold text-muted">
                      Contenu supprimé
                    </span>
                  ) : !authorMembershipId ? (
                    <span className="rounded-full bg-warm px-2.5 py-0.5 text-xs font-semibold text-muted">
                      Utilisateur supprimé
                    </span>
                  ) : (
                    <span className="min-w-0 flex-1" aria-hidden />
                  )}
                  <ReportResolutionBadge
                    status={report.status}
                    resolution={report.resolution}
                    meta={resolutionMeta}
                    suspensionReason={
                      report.resolution === "content_suspended" &&
                      report.context_type !== "user"
                        ? contentSuspensionReasonById[report.context_id] ?? null
                        : null
                    }
                  />
                </div>

                <p className="text-xs font-medium text-muted">{communeName}</p>

                {showRelatedLink ? (
                  <ReportRelatedCountLink
                    count={relatedCount}
                    contextLabel={contextLabel}
                    title={contentTitle}
                    tri={listParams.tri}
                    listPath={ROUTES.backoffice.signalements}
                  />
                ) : null}

                <div className="my-3 text-sm text-muted">
                  <span className="font-medium text-text">Motif du signalement :</span>
                  <MultilineText
                    text={report.reason}
                    className="mt-1 text-sm font-medium text-muted"
                  />
                </div>

                <div className="flex flex-wrap items-end justify-between gap-2">
                  {isPending ? (
                    <ReportActionsClient
                      reportId={report.id}
                      contextType={report.context_type}
                      contextId={report.context_id}
                      authorMembershipId={authorMembershipId}
                      authorName={
                        authorMembershipId
                          ? authorNameByMembershipId[authorMembershipId] ?? null
                          : null
                      }
                      isAuthorSelf={isAuthorSelf}
                      contentDeleted={
                        report.context_type !== "user" && !contentTitle
                      }
                    />
                  ) : restoreContext ? (
                    <ReportRestoreStatus
                      isStillSuspended={restoreContext.isStillSuspended}
                      lastRestore={restoreContext.lastRestore}
                      resolution={report.resolution as "content_suspended" | "user_suspended"}
                      contextType={report.context_type}
                      contextId={report.context_id}
                      authorMembershipId={authorMembershipId}
                    />
                  ) : (
                    <span aria-hidden className="flex-1" />
                  )}
                  <span className="text-right text-xs text-muted md:ml-auto md:shrink-0">
                    Signalé par {reporterName}, le{" "}
                    {formatCompactShortDate(report.created_at)}
                  </span>
                </div>
              </Card>
            );
          })
        )}
      </div>

      <ReportListPagination
        params={listParams}
        totalCount={totalCount}
        basePath={ROUTES.backoffice.signalements}
      />
    </PageStack>
  );
}
