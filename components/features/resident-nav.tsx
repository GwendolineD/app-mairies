"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RESIDENT_BOTTOM_NAV } from "@/lib/constants/routes";
import { cn } from "@/lib/utils/cn";
import { isActivePath } from "@/lib/utils/routes";
import {
  CalendarDays,
  Home,
  Mail,
  Megaphone,
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
  const Icon = RESIDENT_NAV_ICONS[label as keyof typeof RESIDENT_NAV_ICONS];

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

/** Mobile only — fixed bottom bar (< md). */
export function BottomNav() {
  const links = useResidentNavLinks();

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-30 grid grid-cols-5 border-t border-border/80 bg-surface/95 backdrop-blur md:hidden",
        "supports-[backdrop-filter]:bg-surface/80",
        "pb-[max(env(safe-area-inset-bottom),8px)] pt-2",
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
    </nav>
  );
}

type ResidentSidebarNavProps = {
  collapsed?: boolean;
};

/** Desktop only — vertical sidebar (≥ md). */
export function ResidentSidebarNav({ collapsed = false }: ResidentSidebarNavProps) {
  const links = useResidentNavLinks();

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
    </nav>
  );
}
