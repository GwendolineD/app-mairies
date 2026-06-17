import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Props = {
  colorHex: string;
  Icon: LucideIcon;
  className?: string;
  iconClassName?: string;
};

export function CategoryIconBadge({
  colorHex,
  Icon,
  className,
  iconClassName,
}: Props) {
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-md",
        className,
      )}
      style={{ backgroundColor: `${colorHex}22`, color: colorHex }}
    >
      <Icon
        className={cn("size-3.5", iconClassName)}
        strokeWidth={2}
        aria-hidden
      />
    </span>
  );
}
