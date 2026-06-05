import {
  isAnnouncementType,
  type AnnouncementType,
} from "@/lib/constants/announcement-types";
import { ROUTES } from "@/lib/constants/routes";
import { AssetPlaceholder } from "@/components/ui/asset-placeholder";
import { BackLink } from "@/components/ui/back-link";
import { AnnouncementForm } from "@/components/features/announcements/announcement-form";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";

export default async function NouvelleAnnoncePage(props: {
  searchParams?: Promise<{ type?: string }>;
}) {
  const sp = (await props.searchParams) ?? {};
  const rawType = sp.type ?? "";
  const presetType: AnnouncementType = isAnnouncementType(rawType)
    ? rawType
    : "demande";

  return (
    <PageStack>
      <BackLink href={ROUTES.annonces.list}>← Retour liste</BackLink>
      <PageHeading
        className="mt-3"
        title="Nouvelle annonce"
        subtitle="Racontez clairement ce dont vous avez besoin ou ce que vous proposez : vos voisin·es se réjouissent d'aider lorsque tout est précis et respectueux."
      />
      <Card className="mt-2 space-y-4 p-5 lg:max-w-3xl">
        <AssetPlaceholder
          description="Aperçu photo — saisissez une URL ci-dessous"
          aspectRatio="16/9"
          className="rounded-2xl"
        />
        <AnnouncementForm presetType={presetType} />
      </Card>
    </PageStack>
  );
}
