import { requireCommuneStaff } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getCommuneSubscriptionInfo } from "@/lib/queries/commune-subscription";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";
import { SubscriptionPeriodsTable } from "@/components/features/municipality/subscription-periods-table";

export const dynamic = "force-dynamic";

export default async function MairieAbonnementPage() {
  const ctx = await requireCommuneStaff();
  const supabase = await createClient();

  const subscriptionInfo = await getCommuneSubscriptionInfo(
    supabase,
    ctx.communeId,
  );

  const cancellationsBySubscription = Object.fromEntries(
    subscriptionInfo.cancellations
      .filter((r) => r.subscription_id !== null)
      .map((r) => [
        r.subscription_id,
        {
          createdAt: r.created_at,
          requesterName: r.requester_name,
          comment: r.comment,
        },
      ]),
  );

  return (
    <PageStack>
      <PageHeading title="Abonnement" />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold leading-7 text-text">
          Historique des périodes
        </h2>
        <Card className="p-6">
          <SubscriptionPeriodsTable
            communeId={ctx.communeId}
            periods={subscriptionInfo.periods}
            cancellationsBySubscription={cancellationsBySubscription}
          />
        </Card>
      </section>
    </PageStack>
  );
}
