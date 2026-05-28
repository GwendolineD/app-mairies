import Link from "next/link";
import { createInitiative } from "@/lib/actions/initiatives";
import { Card } from "@/components/ui/card";
import { GradientButton } from "@/components/ui/gradient-button";
import { PageHeading } from "@/components/ui/page-heading";

export default function NouvelleInitiativePage() {
  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <Link href="/initiatives" className="text-xs font-semibold text-purple underline">
        ← Liste
      </Link>
      <PageHeading title="Nouvelle initiative" />
      <Card className="space-y-3 p-5">
        <form action={createInitiative} className="flex flex-col gap-3">
          <label className="text-sm font-medium text-text">
            Titre
            <input
              name="title"
              required
              className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-purple"
            />
          </label>
          <label className="text-sm font-medium text-text">
            Description optionnelle
            <textarea
              name="description"
              rows={4}
              className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-purple"
            />
          </label>
          <label className="text-sm font-medium text-text">
            Temporalité
            <select
              name="dateMode"
              className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-purple"
            >
              <option value="none">Libre / permanente</option>
              <option value="once">Événement ponctuel</option>
              <option value="recurring">Récurrent (règle à préciser ensuite)</option>
            </select>
          </label>
          <fieldset className="space-y-2 rounded-2xl border border-border px-4 py-3">
            <legend className="px-2 text-[10px] font-semibold uppercase text-muted">
              Si ponctuelle
            </legend>
            <label className="text-xs font-medium text-text">
              Début
              <input
                type="datetime-local"
                name="singleStartsAt"
                className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-purple"
              />
            </label>
            <label className="text-xs font-medium text-text">
              Fin
              <input
                type="datetime-local"
                name="singleEndsAt"
                className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-purple"
              />
            </label>
          </fieldset>
          <GradientButton type="submit" gradient="initiative" className="w-full">
            Publier l&apos;initiative
          </GradientButton>
        </form>
      </Card>
    </div>
  );
}
