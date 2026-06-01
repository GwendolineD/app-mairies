"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ResidentSidebarNav } from "@/components/features/resident-nav";
import { cn } from "@/lib/utils/cn";

const STORAGE_KEY = "vl:resident-sidebar-collapsed";

function readCollapsedPreference(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function writeCollapsedPreference(collapsed: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, collapsed ? "true" : "false");
  } catch {
    // ignore quota errors
  }
}

/** Desktop only — collapsible vertical sidebar (≥ md). */
export function ResidentSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCollapsed(readCollapsedPreference());
    setHydrated(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      writeCollapsedPreference(next);
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "group/sidebar relative hidden shrink-0 flex-col overflow-visible bg-sidebar py-6 transition-[width] duration-200 ease-in-out md:flex",
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
          "pointer-events-none opacity-0 group-hover/sidebar:pointer-events-auto group-hover/sidebar:opacity-100",
        )}
      >
        {collapsed ? (
          <ChevronRight className="size-4 text-coral" aria-hidden />
        ) : (
          <ChevronLeft className="size-4 text-coral" aria-hidden />
        )}
      </button>

      <div className={cn("min-w-0", collapsed && "overflow-hidden")}>
        <ResidentSidebarNav collapsed={collapsed} />
      </div>
    </aside>
  );
}
