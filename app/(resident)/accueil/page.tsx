import Link from "next/link";
import { AssetPlaceholder } from "@/components/ui/asset-placeholder";
import { Card } from "@/components/ui/card";
import { ContentTypeTag } from "@/components/ui/content-type-tag";
import { GradientButton } from "@/components/ui/gradient-button";
import { ROUTES } from "@/lib/constants/routes";

export default function ResidentAccueilPage() {
  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <AssetPlaceholder
        description="Bloc nudge empathique bienveillant — à concevoir ensemble"
        className="rounded-3xl shadow-card"
      />
      <div className="grid grid-cols-1 gap-3">
        <GradientButton href={ROUTES.annonces.new("demande")} gradient="demande">
          Je demande une main
        </GradientButton>
        <GradientButton href={ROUTES.annonces.new("offre")} gradient="offre">
          Je propose mon aide
        </GradientButton>
        <GradientButton href={ROUTES.initiatives.new} gradient="initiative">
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
            <Link href={ROUTES.annonces.list} className="font-semibold text-purple underline">
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
            <ContentTypeTag type="initiative" />
            <Link
              href={ROUTES.initiatives.list}
              className="text-xl font-semibold leading-7 text-text hover:text-purple"
            >
              Projets civiques & coopérations
            </Link>
          </Card>
          <Card className="space-y-3 p-4">
            <ContentTypeTag type="event" />
            <Link
              href={ROUTES.evenements.list}
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
