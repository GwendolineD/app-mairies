"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AssistanceModal } from "@/components/features/assistance/assistance-modal";
import { AssistanceTrigger } from "@/components/features/assistance/assistance-trigger";
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
export function ResidentSidebar({
  unreadMessages = 0,
  supportEmail,
}: {
  unreadMessages?: number;
  supportEmail: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [assistanceOpen, setAssistanceOpen] = useState(false);

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
    <>
      <aside
        className={cn(
          "group/sidebar relative hidden min-h-0 shrink-0 flex-col overflow-visible bg-sidebar py-6 transition-[width] duration-200 ease-in-out md:flex",
          collapsed ? "px-2 md:w-16" : "px-3 md:w-48 lg:w-52",
          !hydrated && "md:w-48 lg:w-52",
        )}
      >
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Agrandir le menu" : "Réduire le menu"}
          className={cn(
            "absolute top-1 -right-3 z-10 flex size-7 items-center justify-center rounded-full bg-soft-pink text-coral shadow-sm transition hover:bg-soft-pink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/30",
            collapsed
              ? "opacity-100"
              : "hidden group-hover/sidebar:flex focus-visible:flex",
          )}
        >
          {collapsed ? (
            <ChevronRight className="size-4 text-coral" aria-hidden />
          ) : (
            <ChevronLeft className="size-4 text-coral" aria-hidden />
          )}
        </button>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-w-0 flex-1 overflow-hidden">
            <ResidentSidebarNav collapsed={collapsed} unreadMessages={unreadMessages} />
          </div>

          <div className="mt-auto shrink-0 pt-4">
            <AssistanceTrigger
              variant="sidebar"
              collapsed={collapsed}
              onOpen={() => setAssistanceOpen(true)}
            />
          </div>
        </div>
      </aside>

      <AssistanceModal
        open={assistanceOpen}
        onClose={() => setAssistanceOpen(false)}
        supportEmail={supportEmail}
      />
    </>
  );
}
