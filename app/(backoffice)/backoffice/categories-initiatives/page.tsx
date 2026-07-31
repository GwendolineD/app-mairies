import { getInitiativeEventCategories } from "@/lib/queries/initiative-event-categories";
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";
import { InitiativeEventCategoriesGrid } from "@/components/features/backoffice/initiative-event-categories-grid";

export const dynamic = "force-dynamic";

export default async function BackofficeCategoriesInitiativesPage() {
  const categories = await getInitiativeEventCategories();

  return (
    <PageStack>
      <PageHeading title="Catégories initiatives & événements" />
      <InitiativeEventCategoriesGrid categories={categories} />
    </PageStack>
  );
}
