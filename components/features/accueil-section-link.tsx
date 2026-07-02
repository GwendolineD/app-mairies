import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export function AccueilSectionLink({
  href,
  label,
  size = "default",
}: {
  href: string;
  label: string;
  size?: "default" | "sm";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "font-bold text-coral hover:underline",
        size === "sm" ? "text-[10px] md:text-xs" : "text-sm",
      )}
    >
      {label} →
    </Link>
  );
}
