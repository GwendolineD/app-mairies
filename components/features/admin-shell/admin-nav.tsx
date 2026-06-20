"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { AdminNavItem } from "@/lib/constants/routes";
import { ROUTES } from "@/lib/constants/routes";
import { cn } from "@/lib/utils/cn";
import { resolveActiveNavHref } from "@/lib/utils/routes";
import {
  ArrowLeft,
  Building2,
  CalendarPlus,
  CalendarDays,
  CreditCard,
  Flag,
  Flame,
  LayoutDashboard,
  Mail,
  Settings,
  Sparkles,
  Tags,
  Users,
  type LucideIcon,
} from "lucide-react";

const ADMIN_NAV_ICONS: Record<AdminNavItem["icon"], LucideIcon> = {
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
};

type NavLinkProps = {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  variant: "pill" | "sidebar";
  collapsed?: boolean;
};

const SIDEBAR_LINK_CLASS = (active: boolean, collapsed: boolean) =>
  cn(
    "flex items-center rounded-sm text-sm font-semibold transition",
    collapsed
      ? "w-full max-w-full justify-center overflow-hidden px-2 py-3"
      : "gap-3 px-4 py-3",
    active ? "bg-soft-pink text-coral" : "text-text hover:bg-soft-pink/70",
  );

function AdminNavLink({
  href,
  label,
  icon: Icon,
  active,
  variant,
  collapsed,
}: NavLinkProps) {
  if (variant === "sidebar") {
    const linkClass = SIDEBAR_LINK_CLASS(active, !!collapsed);

    if (collapsed) {
      return (
        <Popover>
          <PopoverTrigger
            openOnHover
            delay={200}
            closeDelay={100}
            nativeButton={false}
            render={
              <Link href={href} aria-label={label} className={linkClass} />
            }
          >
            <Icon
              className={cn(
                "size-5 shrink-0",
                active ? "text-coral" : "text-coral/85",
              )}
              aria-hidden
            />
          </PopoverTrigger>
          <PopoverContent
            side="right"
            align="center"
            sideOffset={8}
            className={cn(
              "w-auto min-w-0 gap-0 border-0 p-0 shadow-md ring-1 ring-foreground/10",
              active && "bg-soft-pink",
            )}
          >
            <span
              className={cn(
                "whitespace-nowrap px-2.5 py-1.5 text-sm font-semibold",
                active ? "text-coral" : "text-text",
              )}
            >
              {label}
            </span>
          </PopoverContent>
        </Popover>
      );
    }

    return (
      <Link href={href} className={linkClass}>
        <Icon
          className={cn("size-5 shrink-0", active ? "text-coral" : "text-coral/85")}
          aria-hidden
        />
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-4 py-2 text-xs font-semibold transition",
        active
          ? "bg-soft-pink text-coral"
          : "border border-border bg-surface text-muted hover:text-text",
      )}
    >
      {label}
    </Link>
  );
}

function BackToAppLink({
  href,
  variant,
  collapsed,
}: {
  href: string;
  variant: "pill" | "sidebar";
  collapsed?: boolean;
}) {
  const label = "Retour à l'app";
  const Icon = ArrowLeft;

  if (variant === "sidebar") {
    const linkClass = SIDEBAR_LINK_CLASS(false, !!collapsed);

    if (collapsed) {
      return (
        <Popover>
          <PopoverTrigger
            openOnHover
            delay={200}
            closeDelay={100}
            nativeButton={false}
            render={
              <Link
                href={href}
                aria-label={label}
                className={linkClass}
              />
            }
          >
            <Icon className="size-5 shrink-0 text-coral/85" aria-hidden />
          </PopoverTrigger>
          <PopoverContent
            side="right"
            align="center"
            sideOffset={8}
            className="w-auto min-w-0 gap-0 border-0 p-0 shadow-md ring-1 ring-foreground/10"
          >
            <span className="whitespace-nowrap px-2.5 py-1.5 text-sm font-semibold text-text">
              {label}
            </span>
          </PopoverContent>
        </Popover>
      );
    }

    return (
      <Link href={href} className={linkClass}>
        <Icon className="size-5 shrink-0 text-coral/85" aria-hidden />
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple transition hover:text-purple/80"
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {label}
    </Link>
  );
}

function AdminMobileTabLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "relative flex min-h-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-semibold leading-tight transition",
        active
          ? "text-coral after:absolute after:inset-x-0 after:top-0 after:h-0.5 after:bg-coral"
          : "text-text hover:text-purple",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="size-5 shrink-0" aria-hidden />
      <span className="w-full truncate text-center">{label}</span>
    </Link>
  );
}

type AdminSidebarNavProps = {
  navItems: readonly AdminNavItem[];
  collapsed?: boolean;
  backHref?: string;
  sectionLabel?: string;
  title?: string;
};

/** Desktop only — vertical sidebar (≥ md). */
export function AdminSidebarNav({
  navItems,
  collapsed = false,
  backHref = ROUTES.accueil,
  sectionLabel,
  title,
}: AdminSidebarNavProps) {
  const pathname = usePathname();
  const visibleNavItems = navItems.filter((item) => !item.hidden);
  const activeHref = resolveActiveNavHref(
    pathname,
    visibleNavItems.map((item) => item.href),
  );

  return (
    <nav
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2",
        collapsed && "overflow-hidden",
      )}
      aria-label="Navigation administration"
    >
      {!collapsed && sectionLabel ? (
        <p className="px-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-subtle">
          {sectionLabel}
        </p>
      ) : null}
      {!collapsed && title ? (
        <p className="mb-2 px-4 text-lg font-bold leading-7 text-text">{title}</p>
      ) : null}

      {visibleNavItems.map(({ href, label, icon }) => {
        const Icon = ADMIN_NAV_ICONS[icon];
        return (
          <AdminNavLink
            key={href}
            href={href}
            label={label}
            icon={Icon}
            active={href === activeHref}
            variant="sidebar"
            collapsed={collapsed}
          />
        );
      })}

      <div
        className={cn(
          "mt-auto flex flex-col gap-2 border-t border-border pt-4",
          collapsed && "items-center",
        )}
      >
        {!collapsed ? (
          <p className="px-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-subtle">
            Application
          </p>
        ) : null}
        <BackToAppLink href={backHref} variant="sidebar" collapsed={collapsed} />
      </div>
    </nav>
  );
}

type AdminMobileNavProps = {
  navItems: readonly AdminNavItem[];
  backHref?: string;
};

/** Mobile only — back link below header (< md). */
export function AdminMobileBackBar({
  backHref = ROUTES.accueil,
}: Pick<AdminMobileNavProps, "backHref">) {
  return (
    <div className="shrink-0 border-b border-border/60 px-5 py-3 md:hidden">
      <BackToAppLink href={backHref} variant="pill" />
    </div>
  );
}

/** Mobile only — fixed bottom tab bar (< md). */
export function AdminMobileBottomNav({
  navItems,
}: Pick<AdminMobileNavProps, "navItems">) {
  const pathname = usePathname();
  const visibleNavItems = navItems.filter((item) => !item.hidden);
  const activeHref = resolveActiveNavHref(
    pathname,
    visibleNavItems.map((item) => item.href),
  );

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-[1100] flex w-full items-stretch border-t border-border/80 bg-surface/95 backdrop-blur md:hidden",
        "supports-[backdrop-filter]:bg-surface/80",
        "pb-[max(env(safe-area-inset-bottom),8px)]",
      )}
      aria-label="Navigation administration"
    >
      {visibleNavItems.map(({ href, label, icon }) => {
        const Icon = ADMIN_NAV_ICONS[icon];
        return (
          <AdminMobileTabLink
            key={href}
            href={href}
            label={label}
            icon={Icon}
            active={href === activeHref}
          />
        );
      })}
    </nav>
  );
}
