import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  BackofficeListFilters,
  BackofficeListLinkCard,
  BackofficeListPagination,
  BackofficeListResultCount,
} from "@/components/features/backoffice/backoffice-list-toolbar";
import { CommuneDetailHeader } from "@/components/features/backoffice/commune-detail-header";
import { CommuneSubscriptionSection } from "@/components/features/backoffice/commune-subscription-section";
import { CommuneTrialSection } from "@/components/features/backoffice/commune-trial-section";
import { CommuneWelcomeMessageEditor } from "@/components/features/backoffice/commune-welcome-message-editor";
import { MembershipStatusBadge } from "@/components/features/backoffice/membership-status-badge";
import { HistoryBackLink } from "@/components/ui/history-back-link";
import { Card } from "@/components/ui/card";
import { PageStack } from "@/components/ui/page-stack";
import { ROUTES } from "@/lib/constants/routes";
import { getCommuneDetailStats } from "@/lib/queries/backoffice-communes";
import { getCommuneSubscriptionInfo } from "@/lib/queries/commune-subscription";
import { listCommuneMembersPage } from "@/lib/queries/backoffice-memberships";
import { formatShortDate } from "@/lib/utils/format-date";
import { parseBackofficeMembersListParams } from "@/lib/utils/backoffice-search-params";

export const dynamic = "force-dynamic";

const ROLE_LABELS = {
  member: "Résident·e",
  staff: "Staff mairie",
  mayor: "Maire",
} as const;

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
      <HistoryBackLink />

      <CommuneDetailHeader
        name={stats.commune.name}
        postcode={stats.commune.postcode}
        inseeCode={stats.commune.insee_code}
        createdAt={stats.commune.created_at}
        communeId={stats.commune.id}
        accessStatus={stats.commune.access_status}
        mairieAddressStreet={stats.commune.mairie_address_street}
        mairieAddressCity={stats.commune.mairie_address_city}
        mairieAddressPostcode={stats.commune.mairie_address_postcode}
        mairieAddressLat={stats.commune.mairie_address_lat}
        mairieAddressLng={stats.commune.mairie_address_lng}
      />

      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="space-y-1 p-4">
            <p className="text-[10px] font-semibold uppercase text-muted">
              Adhérent·es actifs
            </p>
            <p className="text-3xl font-bold text-purple">
              {stats.activeMembersCount}
            </p>
          </Card>
          <Card className="space-y-1 p-4">
            <p className="text-[10px] font-semibold uppercase text-muted">
              Annonces actives
            </p>
            <p className="text-3xl font-bold text-coral">
              {stats.activeAnnouncementsCount}
            </p>
          </Card>
          <Card className="space-y-1 p-4">
            <p className="text-[10px] font-semibold uppercase text-muted">
              Initiatives actives
            </p>
            <p className="text-3xl font-bold text-mint">
              {stats.activeInitiativesCount}
            </p>
          </Card>
          <Card className="space-y-1 p-4">
            <p className="text-[10px] font-semibold uppercase text-muted">
              Événements actifs
            </p>
            <p className="text-3xl font-bold text-orange">
              {stats.activeEventsCount}
            </p>
          </Card>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="space-y-1 p-4">
            <p className="text-[10px] font-semibold uppercase text-muted">
              Annonces créées
            </p>
            <p className="text-2xl font-bold text-text">
              {stats.totalAnnouncementsCount}
            </p>
          </Card>
          <Card className="space-y-1 p-4">
            <p className="text-[10px] font-semibold uppercase text-muted">
              Initiatives créées
            </p>
            <p className="text-2xl font-bold text-text">
              {stats.totalInitiativesCount}
            </p>
          </Card>
          <Card className="space-y-1 p-4">
            <p className="text-[10px] font-semibold uppercase text-muted">
              Événements créés
            </p>
            <p className="text-2xl font-bold text-text">
              {stats.totalEventsCount}
            </p>
          </Card>
        </div>
      </div>

      <CommuneTrialSection
        communeId={stats.commune.id}
        accessStatus={stats.commune.access_status}
        trialAccessCode={stats.commune.trial_access_code}
        trialMaxMembers={stats.commune.trial_max_members}
        currentMembersCount={stats.activeMembersCount}
      />

      <CommuneSubscriptionSection
        communeId={stats.commune.id}
        subscribedSince={subscriptionInfo.subscribedSince}
        periods={subscriptionInfo.periods}
        cancellationsBySubscription={cancellationsBySubscription}
      />

      <CommuneWelcomeMessageEditor
        communeId={stats.commune.id}
        initialMessage={stats.commune.welcomeMessage}
      />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold leading-7 text-text">Adhérent·es</h2>

        <BackofficeListFilters
          {...memberListQueryProps}
          searchPlaceholder="Rechercher par nom ou prénom"
          roleOptions={[
            { value: "member", label: ROLE_LABELS.member },
            { value: "staff", label: ROLE_LABELS.staff },
            { value: "mayor", label: ROLE_LABELS.mayor },
          ]}
          statusOptions={[
            { value: "active", label: "Active" },
            { value: "suspended", label: "Suspendue" },
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
                titleAside={<MembershipStatusBadge status={member.status} />}
                fields={[
                  { label: "Rôle", value: ROLE_LABELS[member.role] },
                  {
                    label: "Adhésion",
                    value: formatShortDate(member.joinedAt),
                  },
                ]}
              />
            ))}
          </div>
        )}

        <BackofficeListPagination {...memberListQueryProps} />
      </section>
    </PageStack>
  );
}
