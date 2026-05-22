import { Card } from "@/components/ui/card";
import { updateCommuneWelcomeMessage } from "@/lib/actions/municipality";

export default function MairieParametresPage() {
  return (
    <div className="space-y-4">
      <Card className="space-y-3 p-6">
        <h2 className="text-lg font-bold">Paramètres communaux</h2>
        <p className="text-xs leading-relaxed text-muted">
          Ajustez prochainement l&apos;humeur générale&nbsp;: téléphone Mairie public, horaires
          d&apos;accueil, message d&apos;entête…
        </p>
      </Card>
      <Card className="space-y-3 p-6">
        <form action={updateCommuneWelcomeMessage} className="space-y-3">
          <label className="text-sm font-semibold">
            Message d&apos;accueil empathique affiché sur le portail Vie Locale communal
            <textarea
              name="welcomeMessage"
              rows={4}
              placeholder="Une phrase humaine avant les procédures…"
              className="mt-2 w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-purple"
            />
          </label>
          <label className="text-sm font-semibold">
            Horaires d&apos;ouverture
            <textarea
              name="openingHours"
              rows={2}
              placeholder="Lun-Ven …"
              className="mt-2 w-full rounded-2xl border border-border px-4 py-3 text-sm"
            />
          </label>
          <label className="text-sm font-semibold">
            Téléphone public
            <input
              name="phone"
              className="mt-2 w-full rounded-2xl border border-border px-4 py-3 text-sm"
            />
          </label>
          <label className="text-sm font-semibold">
            Adresse administrative
            <input
              name="address"
              className="mt-2 w-full rounded-2xl border border-border px-4 py-3 text-sm"
            />
          </label>
          <label className="text-sm font-semibold">
            Référent·e
            <input
              name="referentName"
              className="mt-2 w-full rounded-2xl border border-border px-4 py-3 text-sm"
            />
          </label>
          <label className="text-sm font-semibold">
            Fonction
            <input
              name="referentRole"
              className="mt-2 w-full rounded-2xl border border-border px-4 py-3 text-sm"
            />
          </label>
          <button
            type="submit"
            className="gradient-initiative rounded-full px-6 py-3 text-sm font-bold text-white shadow-md hover:opacity-95"
          >
            Enregistrer les informations chaleureuses
          </button>
        </form>
      </Card>
    </div>
  );
}
