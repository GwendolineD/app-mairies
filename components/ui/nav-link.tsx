"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { isActivePath } from "@/lib/utils/routes";

type Props = {
  href: string;
  label: string;
  exact?: boolean;
};

export function NavLink({ href, label, exact = false }: Props) {
  const pathname = usePathname();
  const active = isActivePath(pathname, href, exact);

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
