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
} from "lucide-react";

const ICONS = {
  Accueil: Home,
  Annonces: Megaphone,
  Initiatives: LayoutGrid,
  "Événements": Calendar,
  Messages: MessageCircle,
} as const;

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-30 mx-auto grid max-w-md grid-cols-5 border-t border-border/80 bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80",
        "pb-[max(env(safe-area-inset-bottom),8px)] pt-2",
      )}
    >
      {RESIDENT_BOTTOM_NAV.map(({ href, label }) => {
        const Icon = ICONS[label as keyof typeof ICONS];
        const active = isActivePath(pathname, href);
        return (
          <Link
            key={href}
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
      })}
    </nav>
  );
}
