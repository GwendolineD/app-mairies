import { AdminHeader } from "@/components/features/admin-shell/admin-header";
import {
  AdminMobileBackBar,
  AdminMobileBottomNav,
} from "@/components/features/admin-shell/admin-nav";
import { AdminSidebar } from "@/components/features/admin-shell/admin-sidebar";
import { InAppHistoryTracker } from "@/components/features/in-app-history-tracker";
import type { AdminNavBadges, AdminNavItem } from "@/lib/constants/routes";
import { ROUTES } from "@/lib/constants/routes";

type Props = {
  children: React.ReactNode;
  navItems: readonly AdminNavItem[];
  storageKey: string;
  sidebarTitle: string;
  sidebarSectionLabel?: string;
  backHref?: string;
  badges?: AdminNavBadges;
};

export function AdminShell({
  children,
  navItems,
  storageKey,
  sidebarTitle,
  sidebarSectionLabel,
  backHref = ROUTES.accueil,
  badges,
}: Props) {
  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-background text-text">
      <AdminHeader />

      <AdminMobileBackBar backHref={backHref} />

      <div className="flex min-h-0 w-full flex-1">
        <AdminSidebar
          navItems={navItems}
          storageKey={storageKey}
          backHref={backHref}
          sectionLabel={sidebarSectionLabel}
          title={sidebarTitle}
          badges={badges}
        />

        <main className="min-w-0 flex-1 overflow-y-auto bg-surface px-5 pb-28 md:px-6 md:pb-6 lg:px-8">
          <InAppHistoryTracker />
          {children}
        </main>
      </div>

      <AdminMobileBottomNav navItems={navItems} badges={badges} />
    </div>
  );
}
