import { Card } from "@/components/ui/card";
import { GradientButton } from "@/components/ui/gradient-button";
import { PageHeading } from "@/components/ui/page-heading";
import { updateCommuneWelcomeMessage } from "@/lib/actions/municipality";

export default function MairieParametresPage() {
  return (
    <div className="space-y-4">
      <Card className="space-y-3 p-6">
        <PageHeading
          title="Paramètres communaux"
          subtitle="Ajustez prochainement l'humeur générale : téléphone Mairie public, horaires d'accueil, message d'entête…"
        />
      </Card>
      <Card className="space-y-3 p-6">
        <form action={updateCommuneWelcomeMessage} className="space-y-3">
          <label className="text-sm font-medium text-text">
            Message d&apos;accueil empathique affiché sur le portail Vie Locale communal
            <textarea
              name="welcomeMessage"
              rows={4}
              placeholder="Une phrase humaine avant les procédures…"
              className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-purple"
            />
          </label>
          <label className="text-sm font-medium text-text">
            Horaires d&apos;ouverture
            <textarea
              name="openingHours"
              rows={2}
              placeholder="Lun-Ven …"
              className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-purple"
            />
          </label>
          <label className="text-sm font-medium text-text">
            Téléphone public
            <input
              name="phone"
              className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-purple"
            />
          </label>
          <label className="text-sm font-medium text-text">
            Adresse administrative
            <input
              name="address"
              className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-purple"
            />
          </label>
          <label className="text-sm font-medium text-text">
            Référent·e
            <input
              name="referentName"
              className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-purple"
            />
          </label>
          <label className="text-sm font-medium text-text">
            Fonction
            <input
              name="referentRole"
              className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-purple"
            />
          </label>
          <GradientButton type="submit" gradient="initiative" className="w-full">
            Enregistrer les informations chaleureuses
          </GradientButton>
        </form>
      </Card>
    </div>
  );
}
