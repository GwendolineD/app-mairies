import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth/session";
import { submitSuspensionAppeal } from "@/lib/actions/reports";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { signOut } from "@/lib/actions/auth";

export default async function SuspenduPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/connexion");
  if (ctx.activeMembership) redirect("/accueil");
  if (!ctx.isSuspendedForActiveCommune) redirect("/accueil");

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-6 py-12">
      <h1 className="text-center text-2xl font-bold text-text">Compte en pause locale</h1>
      <p className="text-center text-sm leading-relaxed text-muted">
        L&apos;accès aux fonctionnalités de votre commune sélectionnée est temporairement
        suspendu. Vous pouvez toujours contacter vos modératrices et modérateurs pour
        expliquer votre situation.
      </p>
      <Card className="space-y-3 p-6">
        <p className="text-xs uppercase tracking-wide text-subtle">
          Démarche bienveillante
        </p>
        <p className="text-sm text-muted">
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
        <Link
          href="/connexion"
          className="inline-flex items-center justify-center rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-text"
        >
          Retour à l&apos;accueil public
        </Link>
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
      <Button type="submit" className="w-full rounded-full py-3">
        Envoyer ma demande de révision
      </Button>
    </form>
  );
}
