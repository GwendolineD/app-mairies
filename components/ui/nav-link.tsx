"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { isActivePath } from "@/lib/utils/routes";

type Props = {
  href: string;
  label: string;
  exact?: boolean;
  variant?: "pill" | "sidebar";
};

export function NavLink({ href, label, exact = false, variant = "pill" }: Props) {
  const pathname = usePathname();
  const active = isActivePath(pathname, href, exact);

  if (variant === "sidebar") {
    return (
      <Link
        href={href}
        className={cn(
          "flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-semibold transition",
          active
            ? "bg-soft-pink text-purple"
            : "text-muted hover:bg-warm hover:text-text",
        )}
      >
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
          ? "bg-soft-pink text-purple"
          : "border border-border bg-surface text-muted hover:text-text",
      )}
    >
      {label}
    </Link>
  );
}
