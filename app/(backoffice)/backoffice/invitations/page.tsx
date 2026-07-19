import { createClient } from "@/lib/supabase/server";
import {
  BackofficeListLinkCard,
  BackofficeListPagination,
  BackofficeListResultCount,
} from "@/components/features/backoffice/backoffice-list-toolbar";
import { InvitationStatusBadge } from "@/components/features/backoffice/invitation-status-badge";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";
import { ROUTES } from "@/lib/constants/routes";
import { formatShortDate } from "@/lib/datetime";
import { listPilotCommuneOptions } from "@/lib/queries/backoffice-communes";
import { listInvitationsPage } from "@/lib/queries/backoffice-invitations";
import { parseBackofficeInvitationsListParams } from "@/lib/utils/backoffice-invitations-params";
import { InvitationsToolbar } from "./_components/invitations-toolbar";

export const dynamic = "force-dynamic";

export default async function BackofficeInvitationsPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const params = parseBackofficeInvitationsListParams(searchParams);
  const supabase = await createClient();

  const [{ items, totalCount }, communes] = await Promise.all([
    listInvitationsPage(supabase, params),
    listPilotCommuneOptions(supabase),
  ]);

  const listQueryProps = {
    params,
    queryVariant: "invitations" as const,
    totalCount,
    pageSize: params.limit,
  };

  return (
    <PageStack>
      <PageHeading
        title="Invitations"
        subtitle="Invitations voisin·es envoyées par les résident·es, toutes communes confondues."
      />

      <InvitationsToolbar params={params} communes={communes} />

      <BackofficeListResultCount {...listQueryProps} />

      {items.length === 0 ? (
        <Card className="p-6 text-sm font-medium text-muted">
          Aucune invitation ne correspond à votre recherche.
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((invite) => (
            <BackofficeListLinkCard
              key={invite.id}
              href={ROUTES.backoffice.communeDetail(invite.communeId)}
              title={invite.email}
              titleAside={<InvitationStatusBadge status={invite.status} />}
              fields={[
                { label: "Commune", value: invite.communeName },
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
            />
          ))}
        </div>
      )}

      <BackofficeListPagination {...listQueryProps} />
    </PageStack>
  );
}
