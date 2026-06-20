import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MembershipStatusBadge } from "@/components/features/backoffice/membership-status-badge";
import { ChangeRoleButton } from "@/components/features/backoffice/change-role-button";
import { MembershipRoleBadge } from "@/components/features/backoffice/membership-role-badge";
import { SuspendUserButton } from "@/components/features/backoffice/suspend-user-button";
import { HistoryBackLink } from "@/components/ui/history-back-link";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";
import { MEMBERSHIP_STATUS } from "@/lib/constants/statuses";
import { ROUTES } from "@/lib/constants/routes";
import { getBackofficeUserDetail } from "@/lib/queries/backoffice-users";
import { formatShortDate } from "@/lib/utils/format-date";

export const dynamic = "force-dynamic";

export default async function BackofficeUserDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const supabase = await createClient();
  const user = await getBackofficeUserDetail(supabase, id);

  if (!user) notFound();

  const hasActiveMembership = user.memberships.some(
    (membership) => membership.status === MEMBERSHIP_STATUS.active,
  );

  return (
    <PageStack>
      <HistoryBackLink />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading
          title={user.fullName}
          subtitle={`Compte créé le ${formatShortDate(user.createdAt)}`}
        />

        <SuspendUserButton
          mode="all"
          userId={user.userId}
          label="Suspendre de toutes les communes"
          disabled={!hasActiveMembership}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="space-y-1 p-4">
          <p className="text-[10px] font-semibold uppercase text-muted">Annonces créées</p>
          <p className="text-3xl font-bold text-coral">{user.totalAnnouncementsCount}</p>
        </Card>
        <Card className="space-y-1 p-4">
          <p className="text-[10px] font-semibold uppercase text-muted">Initiatives créées</p>
          <p className="text-3xl font-bold text-mint">{user.totalInitiativesCount}</p>
        </Card>
        <Card className="space-y-1 p-4">
          <p className="text-[10px] font-semibold uppercase text-muted">Événements créés</p>
          <p className="text-3xl font-bold text-orange">{user.totalEventsCount}</p>
        </Card>
      </div>

      <section className="space-y-3">
        <PageHeading title="Communes" />

        {user.memberships.length === 0 ? (
          <Card className="p-6 text-sm font-medium text-muted">
            Aucune adhésion active ou suspendue.
          </Card>
        ) : (
          user.memberships.map((membership) => (
            <Card key={membership.membershipId} className="space-y-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <Link
                    href={ROUTES.backoffice.communeDetail(membership.communeId)}
                    className="cursor-pointer text-lg font-semibold text-purple hover:opacity-90"
                  >
                    {membership.communeName}
                  </Link>
                  <p className="text-sm font-medium text-muted">{membership.addressLabel}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <MembershipRoleBadge
                      role={membership.role}
                      isPlatformAdmin={user.isPlatformAdmin}
                    />
                    <MembershipStatusBadge status={membership.status} />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <ChangeRoleButton
                    membershipId={membership.membershipId}
                    userId={user.userId}
                    communeId={membership.communeId}
                    role={membership.role}
                    isPlatformAdmin={user.isPlatformAdmin}
                    memberName={user.fullName}
                    currentUserIsPlatformAdmin
                    size="sm"
                  />
                  <SuspendUserButton
                    mode="membership"
                    membershipId={membership.membershipId}
                    userId={user.userId}
                    label="Suspendre de cette commune"
                    disabled={membership.status !== MEMBERSHIP_STATUS.active}
                  />
                </div>
              </div>
            </Card>
          ))
        )}
      </section>
    </PageStack>
  );
}
