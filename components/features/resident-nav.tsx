"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RESIDENT_BOTTOM_NAV } from "@/lib/constants/routes";
import { cn } from "@/lib/utils/cn";
import { isActivePath } from "@/lib/utils/routes";
import {
  Calendar,
  Home,
  LayoutGrid,
  Megaphone,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";

export const RESIDENT_NAV_ICONS: Record<
  (typeof RESIDENT_BOTTOM_NAV)[number]["label"],
  LucideIcon
> = {
  Accueil: Home,
  Annonces: Megaphone,
  Initiatives: LayoutGrid,
  "Événements": Calendar,
  Messages: MessageCircle,
};

type NavLinkProps = {
  href: string;
  label: string;
  active: boolean;
  variant: "bottom" | "sidebar";
};

function ResidentNavLink({ href, label, active, variant }: NavLinkProps) {
  const Icon = RESIDENT_NAV_ICONS[label as keyof typeof RESIDENT_NAV_ICONS];

  if (variant === "sidebar") {
    return (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
          active
            ? "bg-soft-pink text-purple"
            : "text-muted hover:bg-warm hover:text-text",
        )}
      >
        <Icon className="size-5 shrink-0" aria-hidden />
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

/** Desktop only — vertical sidebar (≥ md). */
export function ResidentSidebarNav() {
  const links = useResidentNavLinks();

  return (
    <nav
      className="hidden flex-col gap-1 md:flex"
      aria-label="Navigation principale"
    >
      {links.map(({ href, label, active }) => (
        <ResidentNavLink
          key={href}
          href={href}
          label={label}
          active={active}
          variant="sidebar"
        />
      ))}
    </nav>
  );
}
