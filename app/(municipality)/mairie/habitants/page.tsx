import { HabitantsSearch } from "./_components/habitants-search";
import { MembershipModerationButton } from "./_components/membership-moderation-button";
import { ChangeRoleButton } from "@/components/features/backoffice/change-role-button";
import { MembershipRoleBadge } from "@/components/features/backoffice/membership-role-badge";
import { MembershipStatusBadge } from "@/components/features/backoffice/membership-status-badge";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";
import { requireCommuneStaff } from "@/lib/auth/session";
import { listCommuneMembersPage } from "@/lib/queries/backoffice-memberships";
import { formatDay } from "@/lib/utils/date";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MAIRIE_HABITANTS_LIST_LIMIT = 500;

function parseSearchQuery(
  searchParams: Record<string, string | string[] | undefined>,
): string {
  const raw = searchParams.q;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return (value ?? "").trim();
}

export default async function MairieHabitantsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { communeId, userId, profile } = await requireCommuneStaff();
  const params = await searchParams;
  const q = parseSearchQuery(params);

  const supabase = await createClient();
  const membersPage = await listCommuneMembersPage(supabase, communeId, {
    q,
    page: 1,
    limit: MAIRIE_HABITANTS_LIST_LIMIT,
  });

  return (
    <PageStack>
      <PageHeading title="Habitant·es inscrit·es" />

      <div className="flex justify-end">
        <HabitantsSearch initialQuery={q} />
      </div>

      <div className="space-y-2">
        {membersPage.items.length === 0 ? (
          <p className="text-sm font-medium text-muted">
            {q
              ? "Aucun·e habitant·e ne correspond à votre recherche."
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
                  <span>{member.firstName}</span>{" "}
                  <span>{member.lastName}</span>
                </p>
              </div>

              <div className="hidden min-w-0 space-y-1 md:block md:col-start-2 md:row-start-1">
                <p className="font-semibold text-text">
                  <span>{member.firstName}</span>
                  <span className="text-muted"> · </span>
                  <span>{member.lastName}</span>
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
