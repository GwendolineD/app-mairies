"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
<<<<<<< HEAD
import { RESIDENT_BOTTOM_NAV, ROUTES } from "@/lib/constants/routes";
=======
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { BackofficeNavLink } from "@/lib/auth/permissions";
import { RESIDENT_BOTTOM_NAV } from "@/lib/constants/routes";
>>>>>>> preprod
import { cn } from "@/lib/utils/cn";
import { isActivePath } from "@/lib/utils/routes";
import { useMessaging } from "@/components/features/messaging/messaging-context";
import {
  Calendar,
  Home,
<<<<<<< HEAD
  LayoutGrid,
=======
  LampDesk,
  Landmark,
  LayoutDashboard,
  Mail,
>>>>>>> preprod
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

const BACKOFFICE_NAV_ICONS: Record<BackofficeNavLink["label"], LucideIcon> = {
  "Espace mairie": Landmark,
  Backoffice: LampDesk,
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
  badge: number;
  variant: "bottom" | "sidebar";
<<<<<<< HEAD
=======
  collapsed?: boolean;
  badge?: number;
>>>>>>> preprod
};

function NavBadge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-5 text-white gradient-hero",
        className,
      )}
      aria-label={`${count} non lus`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

<<<<<<< HEAD
function ResidentNavLink({ href, label, active, badge, variant }: NavLinkProps) {
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
        <span className="flex-1">{label}</span>
        <NavBadge count={badge} />
=======
function BadgePill({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      aria-label={`${count} non lus`}
      className="flex size-5 items-center justify-center rounded-full bg-coral text-[10px] font-bold text-white"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function ResidentNavLink({ href, label, active, variant, collapsed, badge }: NavLinkProps) {
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
                className={cn(linkClass, "relative")}
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
            {badge && badge > 0 ? (
              <span className="absolute top-1 right-1 flex size-2.5 rounded-full bg-coral" />
            ) : null}
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
        <span className="flex-1">{label}</span>
        <BadgePill count={badge ?? 0} />
>>>>>>> preprod
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "relative flex flex-col items-center gap-0.5 rounded-xl px-2 py-1 text-[10px] font-semibold transition",
        active
          ? "bg-soft-pink text-purple"
          : "text-muted hover:text-text",
      )}
    >
      <span className="relative">
        <Icon className="size-6" aria-hidden />
<<<<<<< HEAD
        <NavBadge
          count={badge}
          className="absolute -right-2.5 -top-1.5 border border-surface"
        />
=======
        {badge && badge > 0 ? (
          <span className="absolute -top-1 -right-1.5 flex size-3.5 items-center justify-center rounded-full bg-coral text-[8px] font-bold leading-none text-white">
            {badge > 9 ? "9+" : badge}
          </span>
        ) : null}
>>>>>>> preprod
      </span>
      <span className="text-center">{label}</span>
    </Link>
  );
}

function useResidentNavLinks() {
  const pathname = usePathname();
  const messaging = useMessaging();
  const unread = messaging?.unreadCount ?? 0;
  return RESIDENT_BOTTOM_NAV.map(({ href, label }) => ({
    href,
    label,
    active: isActivePath(pathname, href),
    badge: href === ROUTES.messages ? unread : 0,
  }));
}

type BackofficeNavProps = {
  backofficeLinks?: BackofficeNavLink[];
  unreadMessages?: number;
};

/** Mobile only — fixed bottom bar (< md). */
export function BottomNav({
  unreadMessages = 0,
}: Pick<BackofficeNavProps, "unreadMessages">) {
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
      {links.map(({ href, label, active, badge }) => (
        <ResidentNavLink
          key={href}
          href={href}
          label={label}
          active={active}
          badge={badge}
          variant="bottom"
          badge={label === "Messages" ? unreadMessages : undefined}
        />
      ))}
    </nav>
  );
}

<<<<<<< HEAD
/** Desktop only — vertical sidebar (≥ md). */
export function ResidentSidebarNav({ collapsed }: { collapsed?: boolean } = {}) {
=======
type ResidentSidebarNavProps = {
  collapsed?: boolean;
  unreadMessages?: number;
};

/** Desktop only — vertical sidebar (≥ md). */
export function ResidentSidebarNav({
  collapsed = false,
  unreadMessages = 0,
}: ResidentSidebarNavProps) {
>>>>>>> preprod
  const links = useResidentNavLinks();

  return (
    <nav
      className="hidden flex-col gap-1 md:flex"
      aria-label="Navigation principale"
    >
      {links.map(({ href, label, active, badge }) => (
        <ResidentNavLink
          key={href}
          href={href}
          label={collapsed ? "" : label}
          active={active}
          badge={collapsed ? 0 : badge}
          variant="sidebar"
<<<<<<< HEAD
=======
          collapsed={collapsed}
          badge={label === "Messages" ? unreadMessages : undefined}
>>>>>>> preprod
        />
      ))}
    </nav>
  );
}
