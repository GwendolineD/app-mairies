import Link from "next/link";
import { AssetPlaceholder } from "@/components/ui/asset-placeholder";
import { Card } from "@/components/ui/card";
import { CategoryTag } from "@/components/ui/category-tag";
import { GradientButton } from "@/components/ui/gradient-button";

export default function ResidentAccueilPage() {
  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <AssetPlaceholder
        description="Bloc nudge empathique bienveillant — à concevoir ensemble"
        className="rounded-3xl shadow-card"
      />
      <div className="grid grid-cols-1 gap-3">
        <GradientButton href="/annonces/nouvelle?type=demande" gradient="demande">
          Je demande une main
        </GradientButton>
        <GradientButton href="/annonces/nouvelle?type=offre" gradient="offre">
          Je propose mon aide
        </GradientButton>
        <GradientButton href="/initiatives/nouvelle" gradient="initiative">
          Une initiative commune
        </GradientButton>
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
        <Card className="space-y-2 p-4">
          <p className="text-base font-medium text-text">
            Flux personnalisé des voisin·es
          </p>
          <p className="text-sm font-medium leading-5 text-muted">
            Retrouvez ici vos annonces communautaires et explorez{" "}
            <Link href="/annonces" className="font-semibold text-purple underline">
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
          <Card className="space-y-3 p-4">
            <CategoryTag label="Initiative" className="bg-mint/10 text-mint" />
            <Link
              href="/initiatives"
              className="text-xl font-semibold leading-7 text-text hover:text-purple"
            >
              Projets civiques & coopérations
            </Link>
          </Card>
          <Card className="space-y-3 p-4">
            <CategoryTag label="Événement" className="bg-orange/10 text-orange" />
            <Link
              href="/evenements"
              className="text-xl font-semibold leading-7 text-text hover:text-purple"
            >
              Agenda convivial
            </Link>
          </Card>
        </div>
      </section>
    </>
  );
}
