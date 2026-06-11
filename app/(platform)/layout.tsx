import { AdminShell } from "@/components/features/admin-shell/admin-shell";
import { requirePlatformAdmin } from "@/lib/auth/session";
import {
  PLATFORM_NAV,
  PLATFORM_SIDEBAR_STORAGE_KEY,
} from "@/lib/constants/routes";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePlatformAdmin();

  return (
    <AdminShell
      navItems={PLATFORM_NAV}
      storageKey={PLATFORM_SIDEBAR_STORAGE_KEY}
      sidebarSectionLabel="Plateforme"
      sidebarTitle="Administration"
    >
      {children}
    </AdminShell>
  );
}
