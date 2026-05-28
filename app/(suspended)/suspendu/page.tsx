import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth/session";
import { submitSuspensionAppeal } from "@/lib/actions/reports";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { signOut } from "@/lib/actions/auth";

export default async function SuspenduPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/connexion");
  if (ctx.activeMembership) redirect("/accueil");
  if (!ctx.isSuspendedForActiveCommune) redirect("/accueil");

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
        <SuspendAppealForm />
      </Card>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <form action={signOut}>
          <Button variant="ghost" type="submit">
            Quitter la session
          </Button>
        </form>
        <Button href="/connexion" variant="secondary">
          Retour à l&apos;accueil public
        </Button>
      </div>
    </div>
  );
}

function SuspendAppealForm() {
  return (
    <form action={submitSuspensionAppeal} className="flex flex-col gap-3">
      <label className="text-sm font-medium text-text">
        Votre message (10 caractères minimum)
        <textarea
          name="message"
          required
          minLength={10}
          rows={5}
          className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-purple"
        />
      </label>
      <Button type="submit" className="w-full py-3">
        Envoyer ma demande de révision
      </Button>
    </form>
  );
}
