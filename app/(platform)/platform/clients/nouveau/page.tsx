import { requireRole } from "@/lib/auth/session";
import { USER_ROLES } from "@/lib/constants/roles";
import { PageHeading } from "@/components/ui/page-heading";
import { Card } from "@/components/ui/card";
import { BackLink } from "@/components/ui/back-link";
import { CommuneForm } from "@/components/features/platform/commune-form";
import { ROUTES } from "@/lib/constants/routes";

export default async function PlatformClientNewPage() {
  await requireRole([USER_ROLES.platformAdmin]);

  return (
    <div className="space-y-4">
      <BackLink href={ROUTES.platform.clients}>← Retour aux clients</BackLink>
      <PageHeading
        title="Créer un client"
        subtitle="Ajoutez une commune cliente avec sa formule et son abonnement."
      />
      <Card className="p-6">
        <CommuneForm mode="create" />
      </Card>
    </div>
  );
}
