"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Drawer } from "@base-ui/react/drawer";
import { ArrowLeft, Menu, type LucideIcon } from "lucide-react";

import type { AdminNavItem } from "@/lib/constants/routes";
import type { AdminNavBadgeSlots } from "@/components/features/badges/admin-nav-badge-slots";
import { ROUTES } from "@/lib/constants/routes";
import { cn } from "@/lib/utils/cn";
import { resolveActiveNavHref } from "@/lib/utils/routes";
import {
  Building2,
  CalendarDays,
  CalendarPlus,
  CreditCard,
  FileText,
  Flag,
  Flame,
  LayoutDashboard,
  LifeBuoy,
  Mail,
  Map,
  Megaphone,
  Settings,
  ShieldCheck,
  Sparkles,
  Tags,
  Users,
} from "lucide-react";

const ADMIN_NAV_ICONS: Record<string, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  users: Users,
  settings: Settings,
  flag: Flag,
  "calendar-plus": CalendarPlus,
  "calendar-days": CalendarDays,
  building2: Building2,
  mail: Mail,
  flame: Flame,
  "credit-card": CreditCard,
  tags: Tags,
  sparkles: Sparkles,
  "file-text": FileText,
  "life-buoy": LifeBuoy,
  megaphone: Megaphone,
  "shield-check": ShieldCheck,
  map: Map,
};

type Props = {
  navItems: readonly AdminNavItem[];
  backHref?: string;
  badgeSlots?: AdminNavBadgeSlots;
};

export function AdminMobileDrawer({
  navItems,
  backHref = ROUTES.accueil,
  badgeSlots,
}: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const visibleNavItems = navItems.filter((item) => !item.hidden);
  const activeHref = resolveActiveNavHref(
    pathname,
    visibleNavItems.map((item) => item.href),
  );

  return (
    <Drawer.Root open={open} onOpenChange={setOpen} swipeDirection="left">
      <Drawer.Trigger
        render={
          <button
            type="button"
            className="inline-flex size-11 cursor-pointer items-center justify-center rounded-sm text-text transition hover:bg-warm focus-visible:ring-2 focus-visible:ring-purple/30 md:hidden"
            aria-label="Menu navigation"
          />
        }
      >
        <Menu className="size-5" aria-hidden />
      </Drawer.Trigger>

      <Drawer.SwipeArea className="fixed inset-y-0 left-0 z-[1050] w-4 md:hidden" />

      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 z-[1100] bg-black/40 transition-opacity duration-200 data-closed:opacity-0 data-open:opacity-100" />
        <Drawer.Viewport className="fixed inset-y-0 left-0 z-[1200]">
          <Drawer.Popup className="flex h-full w-72 flex-col bg-surface shadow-elevated transition-transform duration-200 data-closed:-translate-x-full data-open:translate-x-0">
            <Drawer.Content className="flex min-h-0 flex-1 flex-col">
              <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
                <span className="text-sm font-bold text-text">Navigation</span>
                <Drawer.Close
                  render={
                    <button
                      type="button"
                      className="inline-flex size-9 cursor-pointer items-center justify-center rounded-sm text-muted hover:bg-warm hover:text-text"
                      aria-label="Fermer le menu"
                    />
                  }
                >
                  <svg className="size-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M4 4l8 8M12 4l-8 8" />
                  </svg>
                </Drawer.Close>
              </div>

              <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto py-2" aria-label="Navigation administration">
                {visibleNavItems.map(({ href, label, icon }) => {
                  const Icon = ADMIN_NAV_ICONS[icon];
                  const active = href === activeHref;
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 text-sm font-semibold transition",
                        active
                          ? "bg-soft-pink text-coral"
                          : "text-text hover:bg-soft-pink/70",
                      )}
                    >
                      {Icon ? (
                        <Icon
                          className={cn(
                            "size-5 shrink-0",
                            active ? "text-coral" : "text-coral/85",
                          )}
                          aria-hidden
                        />
                      ) : null}
                      <span className="flex-1">{label}</span>
                      {badgeSlots?.drawer?.[href]}
                    </Link>
                  );
                })}
              </nav>

              <div className="shrink-0 border-t border-border px-4 py-3">
                <Link
                  href={backHref}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-sm px-2 py-2.5 text-sm font-semibold text-text transition hover:bg-soft-pink/70"
                >
                  <ArrowLeft className="size-5 shrink-0 text-coral/85" aria-hidden />
                  <span>Retour à l&apos;app</span>
                </Link>
              </div>
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
