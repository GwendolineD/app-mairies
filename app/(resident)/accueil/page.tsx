import Link from "next/link";
import { AssetPlaceholder } from "@/components/ui/asset-placeholder";
import { Card } from "@/components/ui/card";

export default function ResidentAccueilPage() {
  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <AssetPlaceholder
        description="Bloc nudge empathique bienveillant — à concevoir ensemble"
        className="rounded-3xl shadow-card"
      />
      <div className="grid grid-cols-1 gap-3">
        <Link
          href="/annonces/nouvelle?type=demande"
          className="gradient-demande inline-flex items-center justify-center rounded-full px-6 py-3 text-center text-sm font-bold text-white shadow-md hover:opacity-95"
        >
          Je demande une main
        </Link>
        <Link
          href="/annonces/nouvelle?type=offre"
          className="gradient-offre inline-flex items-center justify-center rounded-full px-6 py-3 text-center text-sm font-bold text-white shadow-md hover:opacity-95"
        >
          Je propose mon aide
        </Link>
        <Link
          href="/initiatives/nouvelle"
          className="gradient-initiative inline-flex items-center justify-center rounded-full px-6 py-3 text-center text-sm font-bold text-white shadow-md hover:opacity-95"
        >
          Une initiative commune
        </Link>
      </div>
      <FeedPreview />
    </div>
  );
}

function FeedPreview() {
  return (
    <>
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted">
          Annonces récentes
        </h3>
        <Card className="p-4 space-y-2">
          <p className="text-sm font-semibold text-text">
            Flux personnalisé des voisin·es
          </p>
          <p className="text-xs text-muted">
            Retrouvez ici vos annonces communautaires et explorez{" "}
            <Link href="/annonces" className="font-semibold text-purple">
              la liste et la carte des annonces
            </Link>
            .
          </p>
        </Card>
      </section>
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted">
          Initiatives & événements
        </h3>
        <div className="grid gap-3">
          <Card className="p-4 gradient-initiative bg-opacity-90 text-white">
            <Link
              href="/initiatives"
              className="font-semibold text-white drop-shadow-sm"
            >
              Projets civiques & coopérations
            </Link>
          </Card>
          <Card className="p-4 gradient-events bg-opacity-95 text-white">
            <Link href="/evenements" className="font-semibold text-white drop-shadow-sm">
              Agenda convivial
            </Link>
          </Card>
        </div>
      </section>
    </>
  );
}
