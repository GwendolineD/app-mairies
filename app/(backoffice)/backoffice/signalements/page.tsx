import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";
import { formatCompactShortDate } from "@/lib/utils/format-date";
import { formatDisplayName } from "@/lib/utils/display-name";
import {
  buildReportListQuery,
  filterReports,
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
import {
  buildReportResolutionMetaMaps,
  getReportResolutionMeta,
} from "@/lib/queries/report-resolution-meta";
import {
  buildReportRestoreContextMaps,
  buildRestoredByNameMap,
  getReportRestoreContext,
} from "@/lib/queries/report-restore-context";

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

  const { data: reports } = await supabase
    .from("reports")
    .select(
      `*, reporter_membership:memberships!reports_reporter_membership_id_fkey(
        profiles:profiles!memberships_profiles_user_id_fkey(display_name, first_name, last_name)
      ), commune:communes!reports_commune_id_fkey(name)`,
    )
    .order("created_at", { ascending: listParams.tri === "oldest" })
    .limit(100);

  const contentIds = (reports ?? [])
    .filter((r) => r.context_type !== "user")
    .map((r) => ({ type: r.context_type, id: r.context_id }));

  const titleMap: Record<string, string> = {};
  const authorMembershipIdMap: Record<string, string> = {};
  const announcementTypeMap: Record<string, string> = {};
  const contentSuspendedAtById: Record<string, string | null> = {};
  const contentSuspendedByUserIdById: Record<string, string | null> = {};

  for (const table of ["announcements", "initiatives", "events"] as const) {
    const ctxType =
      table === "announcements"
        ? "announcement"
        : table === "initiatives"
          ? "initiative"
          : "event";
    const ids = contentIds.filter((c) => c.type === ctxType).map((c) => c.id);
    if (ids.length > 0) {
      if (table === "announcements") {
        const { data } = await supabase
          .from("announcements")
          .select("id, title, author_membership_id, type, suspended_at, suspended_by")
          .in("id", ids);
        for (const row of data ?? []) {
          titleMap[row.id] = row.title;
          authorMembershipIdMap[row.id] = row.author_membership_id;
          announcementTypeMap[row.id] = row.type;
          contentSuspendedAtById[row.id] = row.suspended_at;
          contentSuspendedByUserIdById[row.id] = row.suspended_by;
        }
      } else {
        const { data } = await supabase
          .from(table)
          .select("id, title, author_membership_id, suspended_at, suspended_by")
          .in("id", ids);
        for (const row of data ?? []) {
          titleMap[row.id] = row.title;
          authorMembershipIdMap[row.id] = row.author_membership_id;
          contentSuspendedAtById[row.id] = row.suspended_at;
          contentSuspendedByUserIdById[row.id] = row.suspended_by;
        }
      }
    }
  }

  const authorUserIdMap: Record<string, string> = {};
  const membershipStatusById: Record<string, string> = {};
  const membershipSuspendedAtById: Record<string, string | null> = {};
  const authorMembershipIds = [
    ...new Set(Object.values(authorMembershipIdMap)),
  ];
  if (authorMembershipIds.length > 0) {
    const { data: authorMemberships } = await supabase
      .from("memberships")
      .select("id, user_id, status, suspended_at")
      .in("id", authorMembershipIds);
    for (const row of authorMemberships ?? []) {
      authorUserIdMap[row.id] = row.user_id;
      membershipStatusById[row.id] = row.status;
      membershipSuspendedAtById[row.id] = row.suspended_at;
    }
  }

  const userReportUserIds = [
    ...new Set(
      (reports ?? [])
        .filter((report) => report.context_type === "user")
        .map((report) => report.context_id),
    ),
  ];
  const userReportMembershipIdMap: Record<string, string> = {};
  if (userReportUserIds.length > 0) {
    const { data: userReportMemberships } = await supabase
      .from("memberships")
      .select("id, user_id, commune_id, status, suspended_at")
      .in("user_id", userReportUserIds);
    for (const row of userReportMemberships ?? []) {
      userReportMembershipIdMap[`${row.commune_id}:${row.user_id}`] = row.id;
      membershipStatusById[row.id] = row.status;
      membershipSuspendedAtById[row.id] = row.suspended_at;
    }
  }

  const resolutionMetaMaps = await buildReportResolutionMetaMaps(supabase, {
    reports: reports ?? [],
    contentIds: contentIds.map((entry) => entry.id),
    membershipIds: [
      ...authorMembershipIds,
      ...Object.values(userReportMembershipIdMap),
    ],
    contentSuspendedAtById,
    contentSuspendedByUserIdById,
    membershipSuspendedAtById,
  });

  const restoreContextMaps = await buildReportRestoreContextMaps(supabase, {
    contentIds: contentIds.map((entry) => entry.id),
    membershipIds: [
      ...authorMembershipIds,
      ...Object.values(userReportMembershipIdMap),
    ],
    contentSuspendedAtById,
    membershipStatusById,
  });

  const restoredByNameMap = await buildRestoredByNameMap(
    supabase,
    reports ?? [],
  );

  const reportCountByContext = new Map<string, number>();
  for (const report of reports ?? []) {
    if (report.context_type === "user") continue;
    const key = `${report.context_type}:${report.context_id}`;
    reportCountByContext.set(key, (reportCountByContext.get(key) ?? 0) + 1);
  }

  const filteredReports = filterReports(
    reports ?? [],
    listParams,
    announcementTypeMap,
    titleMap,
  );

  return (
    <PageStack>
      <PageHeading
        title="Signalements (Plateforme)"
        subtitle="Tous les signalements de toutes les communes."
      />

      <ReportListToolbar
        params={listParams}
        totalCount={filteredReports.length}
      />

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
                ? userReportMembershipIdMap[
                    `${report.commune_id}:${report.context_id}`
                  ] ?? null
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
                  ) : (
                    <span className="min-w-0 flex-1" aria-hidden />
                  )}
                  <ReportResolutionBadge
                    status={report.status}
                    resolution={report.resolution}
                    meta={resolutionMeta}
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

                <p className="my-3 text-sm text-muted">
                  <span className="font-medium text-text">Motif :</span>{" "}
                  {report.reason}
                </p>

                <div className="flex flex-wrap items-end justify-between gap-2">
                  {isPending ? (
                    <ReportActionsClient
                      reportId={report.id}
                      contextType={report.context_type}
                      contextId={report.context_id}
                      authorMembershipId={authorMembershipId}
                      isAuthorSelf={isAuthorSelf}
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
                  <span className="ml-auto shrink-0 text-xs text-muted">
                    Signalé par {reporterName}, le{" "}
                    {formatCompactShortDate(report.created_at)}
                  </span>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </PageStack>
  );
}
