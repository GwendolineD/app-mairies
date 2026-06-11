import { AdminShell } from "@/components/features/admin-shell/admin-shell";
import { requirePlatformAdmin } from "@/lib/auth/session";
import {
  BACKOFFICE_NAV,
  BACKOFFICE_SIDEBAR_STORAGE_KEY,
} from "@/lib/constants/routes";

export default async function BackofficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePlatformAdmin();

  return (
    <AdminShell
      navItems={BACKOFFICE_NAV}
      storageKey={BACKOFFICE_SIDEBAR_STORAGE_KEY}
      sidebarTitle="Backoffice"
    >
      {children}
    </AdminShell>
  );
}
