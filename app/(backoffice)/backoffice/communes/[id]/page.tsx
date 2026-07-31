import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  BackofficeListFilters,
  BackofficeListLinkCard,
  BackofficeListPagination,
  BackofficeListResultCount,
} from "@/components/features/backoffice/backoffice-list-toolbar";
import { CommuneDetailHeader } from "@/components/features/backoffice/commune-detail-header";
import { CommuneDetailTabs } from "@/components/features/backoffice/commune-detail-tabs";
import { CommuneSiretEditor } from "@/components/features/backoffice/commune-siret-editor";
import { CommuneSubscriptionSection } from "@/components/features/backoffice/commune-subscription-section";
import { CommuneTrialSection } from "@/components/features/backoffice/commune-trial-section";
import { CommuneWelcomeMessageEditor } from "@/components/features/backoffice/commune-welcome-message-editor";
import { ChangeRoleButton } from "@/components/features/backoffice/change-role-button";
import {
  MemberCardStatsLeading,
} from "@/components/features/backoffice/member-card-popovers";
import { MembershipRoleBadge } from "@/components/features/backoffice/membership-role-badge";
import { MemberStatusBadges } from "@/components/features/backoffice/membership-status-badge";
import { HistoryBackLink } from "@/components/ui/history-back-link";
import { CommuneDetailStats } from "@/components/features/backoffice/commune-detail-stats";
import { Card } from "@/components/ui/card";
import { PageStack } from "@/components/ui/page-stack";
import { ROUTES } from "@/lib/constants/routes";
import { ROLE_LABELS } from "@/lib/constants/roles";
import { getCommuneDetailStats } from "@/lib/queries/backoffice-communes";
import { getCommuneSubscriptionInfo } from "@/lib/queries/commune-subscription";
import { listCommuneMembersPage } from "@/lib/queries/backoffice-memberships";
import { formatShortDate } from "@/lib/datetime";
import { parseBackofficeMembersListParams } from "@/lib/utils/backoffice-search-params";

export const dynamic = "force-dynamic";

export default async function BackofficeCommuneDetailPage(props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await props.params;
  const searchParams = (await props.searchParams) ?? {};
  const memberParams = parseBackofficeMembersListParams(searchParams);
  const supabase = await createClient();

  const [stats, membersPage, subscriptionInfo] = await Promise.all([
    getCommuneDetailStats(supabase, id),
    listCommuneMembersPage(supabase, id, memberParams),
    getCommuneSubscriptionInfo(supabase, id),
  ]);

  if (!stats) notFound();

  const cancellationsBySubscription = Object.fromEntries(
    subscriptionInfo.cancellations
      .filter((c) => c.subscription_id !== null)
      .map((c) => [
        c.subscription_id,
        {
          createdAt: c.created_at,
          requesterName: c.requester_name,
          comment: c.comment,
        },
      ]),
  );

  const memberListQueryProps = {
    params: memberParams,
    queryVariant: "members" as const,
    totalCount: membersPage.totalCount,
    pageSize: memberParams.limit,
  };

  return (
    <PageStack>
      <HistoryBackLink fallbackHref={ROUTES.backoffice.communes} />

      <CommuneDetailHeader
        name={stats.commune.name}
        postcode={stats.commune.postcode}
        inseeCode={stats.commune.insee_code}
        createdAt={stats.commune.created_at}
        communeId={stats.commune.id}
        accessStatus={stats.commune.access_status}
        population={stats.commune.population}
        mairieAddressStreet={stats.commune.mairie_address_street}
        mairieAddressCity={stats.commune.mairie_address_city}
        mairieAddressPostcode={stats.commune.mairie_address_postcode}
        mairieAddressLat={stats.commune.mairie_address_lat}
        mairieAddressLng={stats.commune.mairie_address_lng}
      />

      <CommuneDetailStats
        activeMembersCount={stats.activeMembersCount}
        activeAnnouncementsCount={stats.activeAnnouncementsCount}
        activeInitiativesCount={stats.activeInitiativesCount}
        activeEventsCount={stats.activeEventsCount}
        totalAnnouncementsCount={stats.totalAnnouncementsCount}
        totalInitiativesCount={stats.totalInitiativesCount}
        totalEventsCount={stats.totalEventsCount}
      />

      <CommuneDetailTabs
        tabs={[
          { id: "subscription", label: "Abonnements" },
          { id: "members", label: "Adhérents" },
          { id: "settings", label: "Réglages" },
        ]}
        defaultTab="subscription"
      >
        {{
          subscription: (
            <div className="space-y-6">
              <CommuneTrialSection
                communeId={stats.commune.id}
                accessStatus={stats.commune.access_status}
                trialAccessCode={stats.commune.trial_access_code}
                trialMaxMembers={stats.commune.trial_max_members}
                currentMembersCount={stats.activeMembersCount}
              />
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-text">SIRET</h3>
                <CommuneSiretEditor
                  communeId={stats.commune.id}
                  initialSiret={stats.commune.siret ?? ""}
                />
              </section>
              <CommuneSubscriptionSection
                communeId={stats.commune.id}
                subscribedSince={subscriptionInfo.subscribedSince}
                periods={subscriptionInfo.periods}
                cancellationsBySubscription={cancellationsBySubscription}
              />
            </div>
          ),
          members: (
            <section className="space-y-4">
              <BackofficeListFilters
                {...memberListQueryProps}
                searchPlaceholder="Rechercher par nom ou prénom"
                roleOptions={[
                  { value: "member", label: ROLE_LABELS.member },
                  { value: "staff", label: ROLE_LABELS.staff },
                  { value: "mayor", label: ROLE_LABELS.mayor },
                ]}
              />

              <BackofficeListResultCount {...memberListQueryProps} />

              {membersPage.items.length === 0 ? (
                <Card className="p-6 text-sm font-medium text-muted">
                  Aucun adhérent·e ne correspond à votre recherche.
                </Card>
              ) : (
                <div className="space-y-2">
                  {membersPage.items.map((member) => (
                    <BackofficeListLinkCard
                      key={member.membershipId}
                      href={ROUTES.backoffice.userDetail(member.userId)}
                      title={member.fullName}
                      titleAside={
                        <div className="flex flex-wrap items-center gap-2">
                          <MembershipRoleBadge
                            key="role"
                            role={member.role}
                            isPlatformAdmin={member.isPlatformAdmin}
                          />
                          <MemberStatusBadges
                            key="status"
                            status={member.status}
                            suspendedAt={member.suspendedAt}
                            suspendedByName={member.suspendedByName}
                            suspendedReason={member.suspendedReason}
                            bannedAt={member.bannedAt}
                            banReason={member.banReason}
                          />
                        </div>
                      }
                      fieldsDisplay="icon"
                      statsRowLeading={
                        <MemberCardStatsLeading
                          email={member.email}
                          street={member.addressStreet}
                          lieuDit={member.addressLieuDit}
                          postcode={member.addressPostcode}
                          city={member.addressCity}
                          hasPush={member.hasPushNotifications}
                          preferences={member.notificationPreferences}
                        />
                      }
                      fields={[
                        {
                          label: "Annonces",
                          value: member.totalAnnouncements,
                        },
                        {
                          label: "Initiatives",
                          value: member.totalInitiatives,
                        },
                        {
                          label: "Événements",
                          value: member.totalEvents,
                        },
                        {
                          label: "Invitations",
                          value: member.invitationCount,
                        },
                      ]}
                      metaTrailing={`Adhésion · ${formatShortDate(member.joinedAt)}`}
                      footer={
                        <ChangeRoleButton
                          membershipId={member.membershipId}
                          userId={member.userId}
                          communeId={id}
                          role={member.role}
                          isPlatformAdmin={member.isPlatformAdmin}
                          memberName={member.fullName}
                          currentUserIsPlatformAdmin
                          size="sm"
                        />
                      }
                    />
                  ))}
                </div>
              )}

              <BackofficeListPagination {...memberListQueryProps} />
            </section>
          ),
          settings: (
            <section className="space-y-6">
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-text">Message de bienvenue</h3>
                <CommuneWelcomeMessageEditor
                  communeId={stats.commune.id}
                  initialMessage={stats.commune.welcomeMessage}
                />
              </section>
            </section>
          ),
        }}
      </CommuneDetailTabs>
    </PageStack>
  );
}
