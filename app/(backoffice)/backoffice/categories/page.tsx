import { getAnnouncementCategories } from "@/lib/queries/announcement-categories";
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";
import { CategoriesGrid } from "@/components/features/backoffice/categories-grid";

export const dynamic = "force-dynamic";

export default async function BackofficeCategoriesPage() {
  const categories = await getAnnouncementCategories();

  return (
    <PageStack>
      <PageHeading
        title="Catégories d'annonces"
        description="Gérez les catégories disponibles pour les annonces des résidents."
      />
      <CategoriesGrid categories={categories} />
    </PageStack>
  );
}
