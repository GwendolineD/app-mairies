"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  Calendar,
  Home,
  LayoutGrid,
  Megaphone,
  MessageCircle,
} from "lucide-react";

const NAV = [
  { href: "/accueil", label: "Accueil", Icon: Home },
  { href: "/annonces", label: "Annonces", Icon: Megaphone },
  { href: "/initiatives", label: "Initiatives", Icon: LayoutGrid },
  { href: "/evenements", label: "Événements", Icon: Calendar },
  { href: "/messages", label: "Messages", Icon: MessageCircle },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-30 mx-auto grid max-w-md grid-cols-5 border-t border-border/80 bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80",
        "pb-[max(env(safe-area-inset-bottom),8px)] pt-2",
      )}
    >
      {NAV.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
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
