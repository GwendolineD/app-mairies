import Link from "next/link";
import { requireActiveMembership } from "@/lib/auth/session";
import { AssetPlaceholder } from "@/components/ui/asset-placeholder";
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
      <Link href="/annonces" className="text-xs font-semibold text-purple">
        ← Retour liste
      </Link>
      <h1 className="text-xl font-bold text-text">Carte communautaire</h1>
      <p className="text-xs leading-relaxed text-muted">
        Implémentation provisoire : la vue détaillée utilisera ensuite le composant dédié
        <strong className="text-text"> MapViewCommune </strong>pour géolocaliser chaque épingle
        d&apos;annonce (clustering, filtres par catégories&nbsp;: à brancher lorsque vos assets
        seront disponibles).
      </p>
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
