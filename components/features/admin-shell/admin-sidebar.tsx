"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AdminSidebarNav } from "@/components/features/admin-shell/admin-nav";
import type { AdminNavItem } from "@/lib/constants/routes";
import { ROUTES } from "@/lib/constants/routes";
import { cn } from "@/lib/utils/cn";

function readCollapsedPreference(storageKey: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(storageKey) === "true";
  } catch {
    return false;
  }
}

function writeCollapsedPreference(storageKey: string, collapsed: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey, collapsed ? "true" : "false");
  } catch {
    // ignore quota errors
  }
}

type Props = {
  navItems: readonly AdminNavItem[];
  storageKey: string;
  backHref?: string;
  sectionLabel?: string;
  title?: string;
};

/** Desktop only — collapsible vertical sidebar (≥ md). */
export function AdminSidebar({
  navItems,
  storageKey,
  backHref = ROUTES.accueil,
  sectionLabel,
  title,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCollapsed(readCollapsedPreference(storageKey));
    setHydrated(true);
  }, [storageKey]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      writeCollapsedPreference(storageKey, next);
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "group/sidebar relative hidden min-h-0 shrink-0 flex-col overflow-visible bg-sidebar py-6 transition-[width] duration-200 ease-in-out md:flex",
        collapsed ? "px-2 md:w-16" : "px-4 md:w-56 lg:w-64",
        !hydrated && "md:w-56 lg:w-64",
      )}
    >
      <button
        type="button"
        onClick={toggleCollapsed}
        aria-label={collapsed ? "Agrandir le menu" : "Réduire le menu"}
        className={cn(
          "absolute top-6 -right-3 z-10 flex size-7 items-center justify-center rounded-full bg-soft-pink text-coral shadow-sm transition hover:bg-soft-pink focus-visible:pointer-events-auto focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/30",
          collapsed
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0 group-hover/sidebar:pointer-events-auto group-hover/sidebar:opacity-100",
        )}
      >
        {collapsed ? (
          <ChevronRight className="size-4 text-coral" aria-hidden />
        ) : (
          <ChevronLeft className="size-4 text-coral" aria-hidden />
        )}
      </button>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <AdminSidebarNav
          navItems={navItems}
          collapsed={collapsed}
          backHref={backHref}
          sectionLabel={sectionLabel}
          title={title}
        />
      </div>
    </aside>
  );
}
