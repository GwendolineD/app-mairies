import { AdminShell } from "@/components/features/admin-shell/admin-shell";
import { requireCommuneStaff } from "@/lib/auth/session";
import {
  MUNICIPALITY_NAV,
  MUNICIPALITY_SIDEBAR_STORAGE_KEY,
} from "@/lib/constants/routes";
import { getAnnouncementCategories } from "@/lib/queries/announcement-categories";
import { initCategories } from "@/lib/constants/announcement-categories";

export default async function MunicipalityDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCommuneStaff();

  const categoryRows = await getAnnouncementCategories();
  initCategories(categoryRows);

  return (
    <AdminShell
      navItems={MUNICIPALITY_NAV}
      storageKey={MUNICIPALITY_SIDEBAR_STORAGE_KEY}
      sidebarTitle="Espace Mairie"
    >
      {children}
    </AdminShell>
  );
}
