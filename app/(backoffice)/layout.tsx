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
import { countAllPendingReports } from "@/lib/queries/reports";
import { createClient } from "@/lib/supabase/server";

export default async function BackofficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePlatformAdmin();

  const supabase = await createClient();

  const [categoryRows, initiativeCategoryRows, pendingReportsCount] =
    await Promise.all([
      getAnnouncementCategories(),
      getInitiativeEventCategories(),
      countAllPendingReports(supabase),
    ]);
  initCategories(categoryRows);
  initInitiativeEventCategories(initiativeCategoryRows);

  return (
    <AdminShell
      navItems={BACKOFFICE_NAV}
      storageKey={BACKOFFICE_SIDEBAR_STORAGE_KEY}
      sidebarTitle="Backoffice"
      badges={{
        [ROUTES.backoffice.signalements]: pendingReportsCount,
      }}
    >
      {children}
    </AdminShell>
  );
}
