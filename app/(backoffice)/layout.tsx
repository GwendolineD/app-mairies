import { Toaster } from "sonner";
import { AdminShell } from "@/components/features/admin-shell/admin-shell";
import { requirePlatformAdmin } from "@/lib/auth/session";
import {
  BACKOFFICE_NAV,
  BACKOFFICE_SIDEBAR_STORAGE_KEY,
  ROUTES,
} from "@/lib/constants/routes";
import { getAnnouncementCategories } from "@/lib/queries/announcement-categories";
import { initCategories } from "@/lib/constants/announcement-categories";
import { getInitiativeEventCategories } from "@/lib/queries/initiative-event-categories";
import { initInitiativeEventCategories } from "@/lib/constants/initiative-categories";
import {
  mergeAdminNavBadgeSlots,
  openLeadsBadgeSlots,
  openSupportBadgeSlots,
  pendingReportsBadgeSlots,
} from "@/components/features/badges/admin-nav-badge-slots";

export default async function BackofficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePlatformAdmin();

  const badgeSlots = mergeAdminNavBadgeSlots(
    pendingReportsBadgeSlots(ROUTES.backoffice.signalements),
    openSupportBadgeSlots(ROUTES.backoffice.assistance),
    openLeadsBadgeSlots(ROUTES.backoffice.leads),
  );

  const [categoryRows, initiativeCategoryRows] =
    await Promise.all([
      getAnnouncementCategories(),
      getInitiativeEventCategories(),
    ]);
  initCategories(categoryRows);
  initInitiativeEventCategories(initiativeCategoryRows);

  return (
    <AdminShell
      navItems={BACKOFFICE_NAV}
      storageKey={BACKOFFICE_SIDEBAR_STORAGE_KEY}
      sidebarTitle="Backoffice"
      mobileNav="drawer"
      badgeSlots={badgeSlots}
    >
      {children}
      <Toaster position="top-center" richColors closeButton />
    </AdminShell>
  );
}
