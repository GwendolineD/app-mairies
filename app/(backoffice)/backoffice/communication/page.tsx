import { createClient } from "@/lib/supabase/server";
import {
  listAllCommunicationAssets,
  listCommunesForCommunicationForm,
} from "@/lib/queries/communication-assets";
import { CommunicationAssetsGrid } from "@/components/features/backoffice/communication-assets-grid";
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";

export const dynamic = "force-dynamic";

export default async function BackofficeCommunicationPage() {
  const supabase = await createClient();
  const [assets, communes] = await Promise.all([
    listAllCommunicationAssets(supabase),
    listCommunesForCommunicationForm(supabase),
  ]);

  return (
    <PageStack>
      <PageHeading
        title="Supports de communication"
        subtitle="Gérez les flyers et visuels proposés aux équipes mairie pour promouvoir la plateforme."
      />
      <CommunicationAssetsGrid assets={assets} communes={communes} />
    </PageStack>
  );
}
