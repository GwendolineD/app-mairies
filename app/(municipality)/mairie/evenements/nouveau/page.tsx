import Link from "next/link";
import { createEvent } from "@/lib/actions/events";
import { GradientButton } from "@/components/ui/gradient-button";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";

export default function MairieNouveauEvenementPage() {
  return (
    <div className="space-y-5">
      <Link href="/mairie" className="text-xs font-semibold text-purple underline">
        ← Dashboard
      </Link>
      <PageHeading title="Ajouter un événement officiel commun" />
      <Card className="space-y-3 p-6">
        <form action={createEvent} className="space-y-3">
          <label className="text-sm font-medium text-text">
            Titre
            <input
              required
              name="title"
              className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-purple"
            />
          </label>
          <label className="text-sm font-medium text-text">
            Description&nbsp;/ consignes
            <textarea
              name="description"
              rows={4}
              className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-purple"
            />
          </label>
          <label className="text-sm font-medium text-text">
            Début
            <input
              type="datetime-local"
              name="startsAt"
              required
              className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-purple"
            />
          </label>
          <label className="text-sm font-medium text-text">
            Fin
            <input
              type="datetime-local"
              name="endsAt"
              required
              className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-purple"
            />
          </label>
          <GradientButton type="submit" gradient="events" className="w-full">
            Programmer l&apos;événement
          </GradientButton>
        </form>
      </Card>
      <p className="text-xs font-medium text-muted">
        Après redirection sur <strong className="text-text">/evenements</strong>, vos administré·es
        le verront depuis l&apos;application résidentielle classique lorsque vos autorisations de
        rôle correspondent.
      </p>
    </div>
  );
}
