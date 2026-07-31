import { AdminHeader } from "@/components/features/admin-shell/admin-header";
import { AdminMobileDrawer } from "@/components/features/admin-shell/admin-mobile-drawer";
import {
  AdminMobileBackBar,
  AdminMobileBottomNav,
} from "@/components/features/admin-shell/admin-nav";
import { AdminSidebar } from "@/components/features/admin-shell/admin-sidebar";
import { InAppHistoryTracker } from "@/components/features/in-app-history-tracker";
import type { AdminNavBadges, AdminNavItem } from "@/lib/constants/routes";
import { ROUTES } from "@/lib/constants/routes";
import { cn } from "@/lib/utils/cn";

type Props = {
  children: React.ReactNode;
  navItems: readonly AdminNavItem[];
  storageKey: string;
  sidebarTitle: string;
  sidebarSectionLabel?: string;
  backHref?: string;
  badges?: AdminNavBadges;
  /** "bottom" = classic bottom tab bar (mairie); "drawer" = hamburger left drawer (backoffice) */
  mobileNav?: "bottom" | "drawer";
};

export function AdminShell({
  children,
  navItems,
  storageKey,
  sidebarTitle,
  sidebarSectionLabel,
  backHref = ROUTES.accueil,
  badges,
  mobileNav = "bottom",
}: Props) {
  const useDrawer = mobileNav === "drawer";

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-background text-text">
      <AdminHeader
        hamburger={
          useDrawer ? (
            <AdminMobileDrawer
              navItems={navItems}
              backHref={backHref}
              badges={badges}
            />
          ) : undefined
        }
      />

      {!useDrawer && <AdminMobileBackBar backHref={backHref} />}

      <div className="flex min-h-0 w-full flex-1">
        <AdminSidebar
          navItems={navItems}
          storageKey={storageKey}
          backHref={backHref}
          sectionLabel={sidebarSectionLabel}
          title={sidebarTitle}
          badges={badges}
        />

        <main
          className={cn(
            "min-w-0 flex-1 overflow-y-auto bg-surface px-5 md:px-6 lg:px-8",
            useDrawer ? "pb-6" : "pb-28 md:pb-6",
          )}
        >
          <InAppHistoryTracker />
          {children}
        </main>
      </div>

      {!useDrawer && (
        <AdminMobileBottomNav navItems={navItems} badges={badges} />
      )}
    </div>
  );
}
