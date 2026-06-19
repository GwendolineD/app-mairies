import { HabitantsSearch } from "./_components/habitants-search";
import { MembershipModerationButton } from "./_components/membership-moderation-button";
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
  const { communeId, userId } = await requireCommuneStaff();
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
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-lg p-4"
            >
              <Avatar
                profile={{
                  first_name: member.firstName,
                  last_name: member.lastName,
                  display_name: member.fullName,
                  avatar_url: member.avatarUrl,
                }}
                size="sm"
              />
              <div className="min-w-0 space-y-1">
                <p className="font-semibold text-text">
                  <span>{member.firstName}</span>
                  <span className="text-muted"> · </span>
                  <span>{member.lastName}</span>
                </p>
                <p className="text-xs font-medium leading-4 text-subtle">
                  Membre depuis le {formatDay(member.joinedAt)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-4">
                <MembershipStatusBadge
                  status={member.status}
                  suspendedAt={member.suspendedAt}
                  suspendedByName={member.suspendedByName}
                  suspendedReason={member.suspendedReason}
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
