"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { BackofficeNavLink } from "@/lib/auth/permissions";
import { RESIDENT_BOTTOM_NAV } from "@/lib/constants/routes";
import { cn } from "@/lib/utils/cn";
import { isActivePath } from "@/lib/utils/routes";
import {
  Building2,
  CalendarDays,
  Home,
  LayoutDashboard,
  Mail,
  Megaphone,
  Settings,
  Shield,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export const RESIDENT_NAV_ICONS: Record<
  (typeof RESIDENT_BOTTOM_NAV)[number]["label"],
  LucideIcon
> = {
  Accueil: Home,
  Annonces: Megaphone,
  Initiatives: Sparkles,
  "Événements": CalendarDays,
  Messages: Mail,
};

const BACKOFFICE_NAV_ICONS: Record<BackofficeNavLink["label"], LucideIcon> = {
  "Espace mairie": Building2,
  Backoffice: Shield,
};

function navIcon(label: string): LucideIcon {
  return (
    RESIDENT_NAV_ICONS[label as keyof typeof RESIDENT_NAV_ICONS] ??
    BACKOFFICE_NAV_ICONS[label as BackofficeNavLink["label"]] ??
    LayoutDashboard
  );
}

type NavLinkProps = {
  href: string;
  label: string;
  active: boolean;
  variant: "bottom" | "sidebar";
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

function ResidentNavLink({ href, label, active, variant, collapsed }: NavLinkProps) {
  const Icon = navIcon(label);

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
              <Link
                href={href}
                aria-label={label}
                className={linkClass}
              />
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
        "flex flex-col items-center gap-0.5 rounded-xl px-2 py-1 text-[10px] font-semibold transition",
        active
          ? "bg-soft-pink text-purple"
          : "text-muted hover:text-text",
      )}
    >
      <Icon className="size-6" aria-hidden />
      <span className="text-center">{label}</span>
    </Link>
  );
}

function useResidentNavLinks() {
  const pathname = usePathname();
  return RESIDENT_BOTTOM_NAV.map(({ href, label }) => ({
    href,
    label,
    active: isActivePath(pathname, href),
  }));
}

function BackofficeBottomNavItem({ links }: { links: BackofficeNavLink[] }) {
  const pathname = usePathname();

  if (links.length === 1) {
    const link = links[0]!;
    return (
      <ResidentNavLink
        href={link.href}
        label={link.label}
        active={isActivePath(pathname, link.href)}
        variant="bottom"
      />
    );
  }

  const anyActive = links.some((link) => isActivePath(pathname, link.href));

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label="Administration"
            className={cn(
              "flex cursor-pointer flex-col items-center gap-0.5 rounded-xl px-2 py-1 text-[10px] font-semibold transition",
              anyActive
                ? "bg-soft-pink text-purple"
                : "text-muted hover:text-text",
            )}
          />
        }
      >
        <Settings className="size-6" aria-hidden />
        <span className="text-center">Admin</span>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        sideOffset={8}
        className="flex w-auto min-w-44 flex-col gap-1 p-2"
      >
        {links.map((link) => {
          const active = isActivePath(pathname, link.href);
          const Icon = navIcon(link.label);
          return (
            <Link
              key={link.id}
              href={link.href}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm font-semibold transition",
                active
                  ? "bg-soft-pink text-purple"
                  : "text-text hover:bg-warm",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {link.label}
            </Link>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

type BackofficeNavProps = {
  backofficeLinks?: BackofficeNavLink[];
};

/** Mobile only — fixed bottom bar (< md). */
export function BottomNav({ backofficeLinks = [] }: BackofficeNavProps) {
  const links = useResidentNavLinks();
  const hasBackoffice = backofficeLinks.length > 0;

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-30 grid border-t border-border/80 bg-surface/95 backdrop-blur md:hidden",
        "supports-[backdrop-filter]:bg-surface/80",
        "pb-[max(env(safe-area-inset-bottom),8px)] pt-2",
        hasBackoffice ? "grid-cols-6" : "grid-cols-5",
      )}
      aria-label="Navigation principale"
    >
      {links.map(({ href, label, active }) => (
        <ResidentNavLink
          key={href}
          href={href}
          label={label}
          active={active}
          variant="bottom"
        />
      ))}
      {hasBackoffice ? <BackofficeBottomNavItem links={backofficeLinks} /> : null}
    </nav>
  );
}

type ResidentSidebarNavProps = BackofficeNavProps & {
  collapsed?: boolean;
};

/** Desktop only — vertical sidebar (≥ md). */
export function ResidentSidebarNav({
  collapsed = false,
  backofficeLinks = [],
}: ResidentSidebarNavProps) {
  const pathname = usePathname();
  const links = useResidentNavLinks();
  const hasBackoffice = backofficeLinks.length > 0;

  return (
    <nav
      className={cn(
        "flex flex-col gap-2",
        collapsed && "overflow-hidden",
      )}
      aria-label="Navigation principale"
    >
      {links.map(({ href, label, active }) => (
        <ResidentNavLink
          key={href}
          href={href}
          label={label}
          active={active}
          variant="sidebar"
          collapsed={collapsed}
        />
      ))}

      {hasBackoffice ? (
        <div
          className={cn(
            "mt-4 flex flex-col gap-2 border-t border-border pt-4",
            collapsed && "items-center",
          )}
        >
          {!collapsed ? (
            <p className="px-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-subtle">
              Administration
            </p>
          ) : null}
          {backofficeLinks.map((link) => (
            <ResidentNavLink
              key={link.id}
              href={link.href}
              label={link.label}
              active={isActivePath(pathname, link.href)}
              variant="sidebar"
              collapsed={collapsed}
            />
          ))}
        </div>
      ) : null}
    </nav>
  );
}
