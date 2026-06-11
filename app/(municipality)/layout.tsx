import { AdminShell } from "@/components/features/admin-shell/admin-shell";
import { requireCommuneStaff } from "@/lib/auth/session";
import {
  MUNICIPALITY_NAV,
  MUNICIPALITY_SIDEBAR_STORAGE_KEY,
} from "@/lib/constants/routes";

export default async function MunicipalityDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCommuneStaff();

  return (
    <AdminShell
      navItems={MUNICIPALITY_NAV}
      storageKey={MUNICIPALITY_SIDEBAR_STORAGE_KEY}
      sidebarSectionLabel="Municipalité"
      sidebarTitle="Pilotage"
    >
      {children}
    </AdminShell>
  );
}
