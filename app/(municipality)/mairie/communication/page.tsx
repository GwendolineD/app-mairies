import { requireCommuneStaff } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { listCommunicationAssets } from "@/lib/queries/communication-assets";
import { CommunicationCard } from "@/components/features/mairie/communication-card";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";

export const dynamic = "force-dynamic";

export default async function MairieCommunicationPage() {
  const { communeId } = await requireCommuneStaff();
  const supabase = await createClient();
  const assets = await listCommunicationAssets(supabase, communeId);

  return (
    <PageStack>
      <PageHeading
        title="Communication"
        subtitle="Flyers, affiches et supports pour faire connaître la plateforme aux habitant·es."
      />

      {assets.length === 0 ? (
        <Card className="p-6 text-sm font-medium text-muted">
          Aucun support de communication disponible pour le moment.
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {assets.map((asset) => (
            <CommunicationCard key={asset.id} asset={asset} />
          ))}
        </div>
      )}
    </PageStack>
  );
}
