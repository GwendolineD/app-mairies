import Link from "next/link";
import { createEvent } from "@/lib/actions/events";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function MairieNouveauEvenementPage() {
  return (
    <div className="space-y-5">
      <Link href="/mairie" className="text-xs font-semibold text-purple">
        ← Dashboard
      </Link>
      <h2 className="text-xl font-bold">Ajouter un événement officiel commun</h2>
      <Card className="space-y-3 p-6">
        <form action={createEvent} className="space-y-3">
          <label className="text-sm font-semibold">
            Titre
            <input
              required
              name="title"
              className="mt-1 w-full rounded-2xl border border-border px-4 py-3 text-sm"
            />
          </label>
          <label className="text-sm font-semibold">
            Description&nbsp;/ consignes
            <textarea
              name="description"
              rows={4}
              className="mt-1 w-full rounded-2xl border border-border px-4 py-3 text-sm"
            />
          </label>
          <label className="text-sm font-semibold">
            Début
            <input
              type="datetime-local"
              name="startsAt"
              required
              className="mt-1 w-full rounded-2xl border border-border px-4 py-3 text-sm"
            />
          </label>
          <label className="text-sm font-semibold">
            Fin
            <input
              type="datetime-local"
              name="endsAt"
              required
              className="mt-1 w-full rounded-2xl border border-border px-4 py-3 text-sm"
            />
          </label>
          <Button type="submit" className="w-full rounded-full py-3">
            Programmer l&apos;événement
          </Button>
        </form>
      </Card>
      <p className="text-xs text-muted">
        Après redirection sur <strong>/evenements</strong>, vos administré·es le verront depuis
        l&apos;application résidentielle classique lorsque vos autorisations de rôle correspondent.
      </p>
    </div>
  );
}
