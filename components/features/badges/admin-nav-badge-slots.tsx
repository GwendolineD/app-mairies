import { Suspense, type ReactNode } from "react";
import type { AdminNavBadges } from "@/lib/constants/routes";
import {
  OpenLeadsNavBadgeAsync,
  OpenSupportNavBadgeAsync,
  PendingReportsNavBadgeAsync,
  type AdminNavBadgeVariant,
} from "@/components/features/badges/admin-nav-badge-async";

export type AdminNavBadgeSlots = {
  sidebar?: AdminNavBadges;
  sidebarCollapsed?: AdminNavBadges;
  mobile?: AdminNavBadges;
  drawer?: AdminNavBadges;
};

function wrapSuspense(node: ReactNode): ReactNode {
  return <Suspense fallback={null}>{node}</Suspense>;
}

function pendingReportsNode(
  variant: AdminNavBadgeVariant,
  communeId?: string,
): ReactNode {
  return wrapSuspense(
    <PendingReportsNavBadgeAsync variant={variant} communeId={communeId} />,
  );
}

function badgeSlotsForHref(
  href: string,
  render: (variant: AdminNavBadgeVariant) => ReactNode,
): AdminNavBadgeSlots {
  return {
    sidebar: { [href]: render("sidebar-pill") },
    sidebarCollapsed: { [href]: render("sidebar-dot") },
    mobile: { [href]: render("bottom-pill") },
    drawer: { [href]: render("drawer-pill") },
  };
}

export function mergeAdminNavBadgeSlots(
  ...slotSets: AdminNavBadgeSlots[]
): AdminNavBadgeSlots {
  const mergeMaps = (
    key: keyof AdminNavBadgeSlots,
  ): AdminNavBadges | undefined => {
    const merged: AdminNavBadges = {};
    let hasEntries = false;

    for (const set of slotSets) {
      const map = set[key];
      if (!map) continue;
      for (const [href, node] of Object.entries(map)) {
        merged[href] = node;
        hasEntries = true;
      }
    }

    return hasEntries ? merged : undefined;
  };

  return {
    sidebar: mergeMaps("sidebar"),
    sidebarCollapsed: mergeMaps("sidebarCollapsed"),
    mobile: mergeMaps("mobile"),
    drawer: mergeMaps("drawer"),
  };
}

export function pendingReportsBadgeSlots(
  href: string,
  communeId?: string,
): AdminNavBadgeSlots {
  return badgeSlotsForHref(href, (variant) =>
    pendingReportsNode(variant, communeId),
  );
}

export function openSupportBadgeSlots(href: string): AdminNavBadgeSlots {
  return badgeSlotsForHref(href, (variant) =>
    wrapSuspense(<OpenSupportNavBadgeAsync variant={variant} />),
  );
}

export function openLeadsBadgeSlots(href: string): AdminNavBadgeSlots {
  return badgeSlotsForHref(href, (variant) =>
    wrapSuspense(<OpenLeadsNavBadgeAsync variant={variant} />),
  );
}
