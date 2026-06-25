import { MembershipModerationButton } from "./_components/membership-moderation-button";
import { ChangeRoleButton } from "@/components/features/backoffice/change-role-button";
import { MembershipRoleBadge } from "@/components/features/backoffice/membership-role-badge";
import { MembershipStatusBadge } from "@/components/features/backoffice/membership-status-badge";
import { HabitantsListToolbar } from "@/components/features/habitants/habitants-list-toolbar";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";
import { requireCommuneStaff } from "@/lib/auth/session";
import { listCommuneMembersPage } from "@/lib/queries/backoffice-memberships";
import { formatDay } from "@/lib/utils/date";
import {
  hasActiveHabitantsFilters,
  parseHabitantsListParams,
} from "@/lib/utils/habitants-list-params";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MAIRIE_HABITANTS_LIST_LIMIT = 500;

export default async function MairieHabitantsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { communeId, userId, profile } = await requireCommuneStaff();
  const rawParams = await searchParams;
  const listParams = parseHabitantsListParams(rawParams);

  const supabase = await createClient();
  const membersPage = await listCommuneMembersPage(supabase, communeId, {
    q: listParams.q,
    sort: listParams.tri,
    roles: listParams.roles,
    statuses: listParams.statuses,
    page: 1,
    limit: MAIRIE_HABITANTS_LIST_LIMIT,
  });

  const hasFilters =
    !!listParams.q || hasActiveHabitantsFilters(listParams);

  return (
    <PageStack>
      <PageHeading title="Habitant·es inscrit·es" />

      <HabitantsListToolbar
        params={listParams}
        totalCount={membersPage.totalCount}
      />

      <div className="space-y-2">
        {membersPage.items.length === 0 ? (
          <p className="text-sm font-medium text-muted">
            {hasFilters
              ? "Aucun·e habitant·e ne correspond à votre recherche ou à vos filtres."
              : "Aucune adhésion pour l'instant."}
          </p>
        ) : (
          membersPage.items.map((member) => (
            <Card
              key={member.membershipId}
              className="flex flex-col gap-3 rounded-lg p-4 md:grid md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:gap-4"
            >
              <div className="flex flex-wrap items-center justify-end gap-2 md:col-start-3 md:row-start-1">
                <MembershipRoleBadge
                  role={member.role}
                  isPlatformAdmin={member.isPlatformAdmin}
                />
                <MembershipStatusBadge
                  status={member.status}
                  suspendedAt={member.suspendedAt}
                  suspendedByName={member.suspendedByName}
                  suspendedReason={member.suspendedReason}
                />
              </div>

              <div className="flex min-w-0 items-center gap-3 md:contents">
                <Avatar
                  profile={{
                    first_name: member.firstName,
                    last_name: member.lastName,
                    display_name: member.fullName,
                    avatar_url: member.avatarUrl,
                  }}
                  size="sm"
                  className="shrink-0 md:col-start-1 md:row-start-1"
                />
                <p className="min-w-0 font-semibold text-text md:hidden">
                  <span>{member.lastName}</span>{" "}
                  <span>{member.firstName}</span>
                </p>
              </div>

              <div className="hidden min-w-0 space-y-1 md:block md:col-start-2 md:row-start-1">
                <p className="font-semibold text-text">
                  <span>{member.lastName}</span>{" "}
                  <span>{member.firstName}</span>
                </p>
                <p className="text-xs font-medium leading-4 text-subtle">
                  Membre depuis le {formatDay(member.joinedAt)}
                </p>
              </div>

              <p className="text-xs font-medium leading-4 text-subtle md:hidden">
                Membre depuis le {formatDay(member.joinedAt)}
              </p>

              <div className="flex flex-wrap items-center justify-end gap-2 md:col-start-3 md:row-start-2">
                <ChangeRoleButton
                  membershipId={member.membershipId}
                  userId={member.userId}
                  communeId={communeId}
                  role={member.role}
                  isPlatformAdmin={member.isPlatformAdmin}
                  memberName={member.fullName}
                  currentUserIsPlatformAdmin={profile.is_platform_admin}
                  className="h-auto px-4 py-1.5 text-sm md:h-6 md:px-2 md:py-0 md:text-xs"
                />
                <MembershipModerationButton
                  membershipId={member.membershipId}
                  status={member.status}
                  isSelf={member.userId === userId}
                />
              </div>
            </Card>
          ))
        )}
      </div>
    </PageStack>
  );
}
