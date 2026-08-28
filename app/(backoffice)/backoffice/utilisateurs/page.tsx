import { createClient } from "@/lib/supabase/server";
import {
  BackofficeListLinkCard,
  BackofficeListPagination,
  BackofficeListResultCount,
} from "@/components/features/backoffice/backoffice-list-toolbar";
import { InvitationStatusBadge } from "@/components/features/backoffice/invitation-status-badge";
import { CategoryTag } from "@/components/ui/category-tag";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";
import { PLATFORM_ADMIN_LABEL, ROLE_LABELS } from "@/lib/constants/roles";
import { ROUTES } from "@/lib/constants/routes";
import type { MembershipRole } from "@/lib/types";
import { formatShortDate } from "@/lib/datetime";
import { listPilotCommuneOptions } from "@/lib/queries/backoffice-communes";
import { listInvitationsPage } from "@/lib/queries/backoffice-invitations";
import {
  countGlobalStats,
  getPopulationStats,
  listUsersPage,
} from "@/lib/queries/backoffice-users-list";
import {
  parseBackofficeUtilisateursParams,
  toInvitationsListParams,
} from "@/lib/utils/backoffice-utilisateurs-params";
import { UtilisateursStatsBar } from "./_components/utilisateurs-stats-bar";
import { UtilisateursStatsChart } from "./_components/utilisateurs-stats-chart";
import { UtilisateursToolbar } from "./_components/utilisateurs-toolbar";
import { InvitationActions } from "./_components/invitation-actions";

export const dynamic = "force-dynamic";

export default async function BackofficeUtilisateursPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const params = parseBackofficeUtilisateursParams(searchParams);
  const supabase = await createClient();

  const [globalCounts, communes] = await Promise.all([
    countGlobalStats(supabase),
    listPilotCommuneOptions(supabase),
  ]);

  if (params.tab === "stats") {
    const stats = await getPopulationStats(supabase);

    return (
      <PageStack>
        <PageHeading title="Utilisateurs" />
        <UtilisateursStatsBar counts={globalCounts} />
        <UtilisateursToolbar params={params} communes={communes} />
        <UtilisateursStatsChart stats={stats} />
      </PageStack>
    );
  }

  if (params.tab === "invitations") {
    const invitationParams = toInvitationsListParams(params);
    const invitationsPage = await listInvitationsPage(supabase, invitationParams);
    const listQueryProps = {
      params,
      queryVariant: "utilisateurs" as const,
      totalCount: invitationsPage.totalCount,
      pageSize: params.limit,
    };

    return (
      <PageStack>
        <PageHeading title="Utilisateurs" />
        <UtilisateursStatsBar counts={globalCounts} />
        <UtilisateursToolbar
          params={params}
          communes={communes}
          totalCount={invitationsPage.totalCount}
        />
        <BackofficeListResultCount {...listQueryProps} />

        {invitationsPage.items.length === 0 ? (
          <Card className="p-6 text-sm font-medium text-muted">
            Aucune invitation ne correspond à votre recherche.
          </Card>
        ) : (
          <div className="space-y-2">
            {invitationsPage.items.map((invite) => (
              <BackofficeListLinkCard
                key={invite.id}
                href={ROUTES.backoffice.communeDetail(invite.communeId)}
                title={invite.email}
                titleAside={<InvitationStatusBadge status={invite.status} />}
                fields={[
                  { label: "Commune", value: invite.communeName },
                  { label: "Rôle", value: ROLE_LABELS[invite.intendedRole as MembershipRole] ?? invite.intendedRole },
                  { label: "Invité·e par", value: invite.inviterName },
                  {
                    label: "Relance",
                    value: invite.reminderSent ? "Envoyée" : "Non",
                  },
                ]}
                metaTrailing={
                  <>
                    envoyée le{" "}
                    <span className="text-text">
                      {formatShortDate(invite.createdAt)}
                    </span>
                  </>
                }
                footer={
                  invite.status === "pending" || invite.status === "expired" ? (
                    <InvitationActions inviteId={invite.id} isPending={false} />
                  ) : null
                }
              />
            ))}
          </div>
        )}

        <BackofficeListPagination {...listQueryProps} />
      </PageStack>
    );
  }

  const usersPage = await listUsersPage(supabase, params);
  const listQueryProps = {
    params,
    queryVariant: "utilisateurs" as const,
    totalCount: usersPage.totalCount,
    pageSize: params.limit,
  };

  return (
    <PageStack>
      <PageHeading title="Utilisateurs" />
      <UtilisateursStatsBar counts={globalCounts} />
      <UtilisateursToolbar
        params={params}
        communes={communes}
        totalCount={usersPage.totalCount}
      />
      <BackofficeListResultCount {...listQueryProps} />

      {usersPage.items.length === 0 ? (
        <Card className="p-6 text-sm font-medium text-muted">
          Aucun utilisateur ne correspond à votre recherche.
        </Card>
      ) : (
        <div className="space-y-2">
          {usersPage.items.map((user) => (
            <BackofficeListLinkCard
              key={user.userId}
              href={ROUTES.backoffice.userDetail(user.userId)}
              title={user.fullName}
              titleAside={
                <div className="flex flex-wrap items-center gap-2">
                  {user.isPlatformAdmin ? (
                    <CategoryTag
                      label={PLATFORM_ADMIN_LABEL}
                      className="bg-magenta/10 text-magenta"
                    />
                  ) : null}
                  {user.bannedAt ? (
                    <CategoryTag
                      label="Banni·e"
                      className="bg-coral/10 text-coral"
                    />
                  ) : null}
                </div>
              }
              fields={[
                { label: "Email", value: user.email ?? "—" },
                {
                  label: "Communes",
                  value: `${user.communeCount} commune${user.communeCount > 1 ? "s" : ""}`,
                },
                {
                  label: "Contenus publiés",
                  value: String(user.totalContentCount),
                },
              ]}
              metaTrailing={
                <>
                  inscrit·e le{" "}
                  <span className="text-text">
                    {formatShortDate(user.createdAt)}
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
