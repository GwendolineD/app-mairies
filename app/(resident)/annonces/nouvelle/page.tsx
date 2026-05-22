import Link from "next/link";
import { createAnnouncement } from "@/lib/actions/announcements";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ANNOUNCEMENT_CATEGORIES } from "@/lib/constants/announcement-categories";

export default async function NouvelleAnnoncePage(props: {
  searchParams?: Promise<{ type?: string }>;
}) {
  const sp = (await props.searchParams) ?? {};
  const presetType =
    sp.type === "offre" || sp.type === "demande" ? sp.type : "demande";

  return (
    <div className="px-4 py-6">
      <Link href="/annonces" className="text-xs font-semibold text-purple">
        ← Retour liste
      </Link>
      <h1 className="mt-3 text-xl font-bold text-text">Nouvelle annonce</h1>
      <p className="text-xs text-muted">
        Racontez clairement ce dont vous avez besoin ou ce que vous proposez&nbsp;: vos
        voisin·es se réjouissent d&apos;aider lorsque tout est précis et respectueux.
      </p>
      <Card className="mt-6 space-y-4 p-5">
        <form action={createAnnouncement} className="flex flex-col gap-3">
          <label className="text-sm font-medium text-text">
            Type
            <select
              name="type"
              defaultValue={presetType}
              className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm"
            >
              <option value="demande">Demande</option>
              <option value="offre">Offre</option>
            </select>
          </label>

          <label className="text-sm font-medium text-text">
            Catégorie
            <select
              name="categorySlug"
              className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm"
            >
              {ANNOUNCEMENT_CATEGORIES.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-text">
            Titre
            <input
              name="title"
              required
              minLength={3}
              className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-purple"
              placeholder="Court et chaleureux"
            />
          </label>

          <label className="text-sm font-medium text-text">
            Description (optionnel)
            <textarea
              name="description"
              rows={5}
              className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-purple"
              placeholder="Horaires, durée estimée…"
            />
          </label>

          <label className="text-sm font-medium text-text">
            Date souhaitée (optionnel)
            <input
              name="targetDate"
              type="date"
              className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm"
            />
          </label>

          <label className="text-sm font-medium text-text">
            Photo principale · URL accessible (optionnel)
            <input
              type="url"
              name="photoUrl"
              className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-purple"
              placeholder="https://"
            />
          </label>

          <Button type="submit" className="mt-2 w-full rounded-full py-3">
            Publier mon annonce bienveillante
          </Button>
        </form>
      </Card>
    </div>
  );
}
