import Link from "next/link";
import { createAnnouncement } from "@/lib/actions/announcements";
import { AssetPlaceholder } from "@/components/ui/asset-placeholder";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { ANNOUNCEMENT_CATEGORIES } from "@/lib/constants/announcement-categories";

export default async function NouvelleAnnoncePage(props: {
  searchParams?: Promise<{ type?: string }>;
}) {
  const sp = (await props.searchParams) ?? {};
  const presetType =
    sp.type === "offre" || sp.type === "demande" ? sp.type : "demande";

  return (
    <div className="px-4 py-6">
      <Link href="/annonces" className="text-xs font-semibold text-purple underline">
        ← Retour liste
      </Link>
      <PageHeading
        className="mt-3"
        title="Nouvelle annonce"
        subtitle="Racontez clairement ce dont vous avez besoin ou ce que vous proposez : vos voisin·es se réjouissent d'aider lorsque tout est précis et respectueux."
      />
      <Card className="mt-6 space-y-4 p-5">
        <AssetPlaceholder
          description="Aperçu photo — saisissez une URL ci-dessous"
          aspectRatio="16/9"
          className="rounded-2xl"
        />
        <form action={createAnnouncement} className="flex flex-col gap-3">
          <label className="text-sm font-medium text-text">
            Type
            <select
              name="type"
              defaultValue={presetType}
              className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-purple"
            >
              <option value="demande">Demande</option>
              <option value="offre">Offre</option>
            </select>
          </label>

          <label className="text-sm font-medium text-text">
            Catégorie
            <select
              name="categorySlug"
              className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-purple"
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
              className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-purple"
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

          <Button type="submit" className="mt-2 w-full py-3">
            Publier mon annonce bienveillante
          </Button>
        </form>
      </Card>
    </div>
  );
}
