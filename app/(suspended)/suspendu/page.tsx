import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth/session";
import { submitSuspensionAppeal } from "@/lib/actions/reports";
import { getPlatformSupportEmail } from "@/lib/actions/platform-settings";
import { ROUTES } from "@/lib/constants/routes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField, Textarea } from "@/components/ui/form-field";
import { PageHeading } from "@/components/ui/page-heading";
import { signOut } from "@/lib/actions/auth";

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
        title="Compte en pause locale"
        subtitle="L'accès aux fonctionnalités de votre commune sélectionnée est temporairement suspendu. Vous pouvez toujours contacter vos modératrices et modérateurs pour expliquer votre situation."
      />
      <Card className="space-y-3 p-6">
        <p className="text-xs font-medium uppercase tracking-wide text-subtle">
          Démarche bienveillante
        </p>
        <p className="text-base font-medium leading-6 text-muted">
          Détaillez calmement votre contexte. Notre équipe relira votre message hors
          des heures municipales lorsque la charge administrative le permet.
        </p>
        <p className="text-sm text-muted">
          Vous pouvez aussi nous contacter directement à{" "}
          <a
            href={`mailto:${supportEmail}`}
            className="font-semibold text-purple hover:underline"
          >
            {supportEmail}
          </a>
        </p>
        <SuspendAppealForm />
      </Card>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <form action={signOut}>
          <Button variant="ghost" type="submit">
            Quitter la session
          </Button>
        </form>
        <Button href={ROUTES.connexion} variant="secondary">
          Retour à l&apos;accueil public
        </Button>
      </div>
    </div>
  );
}

function SuspendAppealForm() {
  return (
    <form action={submitSuspensionAppeal} className="flex flex-col gap-3">
      <FormField label="Votre message (10 caractères minimum)">
        <Textarea name="message" required minLength={10} rows={5} />
      </FormField>
      <Button type="submit" className="w-full py-3">
        Envoyer ma demande de révision
      </Button>
    </form>
  );
}
