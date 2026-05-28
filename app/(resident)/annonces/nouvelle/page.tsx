import { createAnnouncement } from "@/lib/actions/announcements";
import {
  ANNOUNCEMENT_TYPES,
  isAnnouncementType,
  type AnnouncementType,
} from "@/lib/constants/announcement-types";
import { ANNOUNCEMENT_CATEGORIES } from "@/lib/constants/announcement-categories";
import { ROUTES } from "@/lib/constants/routes";
import { AssetPlaceholder } from "@/components/ui/asset-placeholder";
import { BackLink } from "@/components/ui/back-link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField, Input, Select, Textarea } from "@/components/ui/form-field";
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
        <form action={createAnnouncement} className="flex flex-col gap-3">
          <FormField label="Type">
            <Select name="type" defaultValue={presetType}>
              {ANNOUNCEMENT_TYPES.map((type) => (
                <option key={type.slug} value={type.slug}>
                  {type.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Catégorie">
            <Select name="categorySlug">
              {ANNOUNCEMENT_CATEGORIES.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Titre">
            <Input
              name="title"
              required
              minLength={3}
              placeholder="Court et chaleureux"
            />
          </FormField>

          <FormField label="Description (optionnel)">
            <Textarea
              name="description"
              rows={5}
              placeholder="Horaires, durée estimée…"
            />
          </FormField>

          <FormField label="Date souhaitée (optionnel)">
            <Input name="targetDate" type="date" />
          </FormField>

          <FormField label="Photo principale · URL accessible (optionnel)">
            <Input
              type="url"
              name="photoUrl"
              placeholder="https://"
            />
          </FormField>

          <Button type="submit" className="mt-2 w-full py-3">
            Publier mon annonce bienveillante
          </Button>
        </form>
      </Card>
    </PageStack>
  );
}
