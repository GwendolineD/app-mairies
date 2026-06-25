import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth/session";
import { getPlatformSupportEmail } from "@/lib/actions/platform-settings";
import { SuspendAppealForm } from "@/components/features/suspended/suspend-appeal-form";
import { signOut } from "@/lib/actions/auth";
import { ROUTES } from "@/lib/constants/routes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";

export default async function SuspenduPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect(ROUTES.connexion);
  if (ctx.activeMembership) redirect(ROUTES.accueil);
  if (!ctx.isSuspendedForActiveCommune) redirect(ROUTES.accueil);

  const supportEmail = await getPlatformSupportEmail();

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-6 py-12">
      <PageHeading
        centered
        title="Votre compte a été suspendu"
        subtitle="L'accès aux fonctionnalités de votre commune sélectionnée est suspendu."
      />
      <Card className="space-y-3 p-6">
        <SuspendAppealForm supportEmail={supportEmail} />
      </Card>
      <div className="flex justify-center">
        <form action={signOut}>
          <Button variant="secondary" type="submit">
            Retour à l&apos;accueil
          </Button>
        </form>
      </div>
    </div>
  );
}
