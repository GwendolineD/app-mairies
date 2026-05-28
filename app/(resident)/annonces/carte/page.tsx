import { requireActiveMembership } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { AssetPlaceholder } from "@/components/ui/asset-placeholder";
import { BackLink } from "@/components/ui/back-link";
import { PageHeading } from "@/components/ui/page-heading";
import { CarteAnnoncesMap } from "@/components/features/carte-preview-map";

export default async function AnnoncesCartePage() {
  const ctx = await requireActiveMembership();
  const lat =
    ctx.activeMembership?.address_lat ??
    ctx.activeMembership?.commune?.centroid_lat ??
    46;
  const lng =
    ctx.activeMembership?.address_lng ??
    ctx.activeMembership?.commune?.centroid_lng ??
    2.3;

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <BackLink href={ROUTES.annonces.list}>← Retour liste</BackLink>
      <PageHeading
        title="Carte communautaire"
        subtitle="Implémentation provisoire : la vue détaillée utilisera ensuite le composant dédié MapViewCommune pour géolocaliser chaque épingle d'annonce."
      />
      <AssetPlaceholder
        aspectRatio="2/5"
        className="rounded-3xl"
        description="Légende & filtres carte — placeholders design"
      />
      <CarteAnnoncesMap
        communeName={
          ctx.activeMembership?.commune?.name ??
          ctx.activeMembership?.commune?.insee_code ??
          "Centre"
        }
        latitude={lat}
        longitude={lng}
      />
    </div>
  );
}
