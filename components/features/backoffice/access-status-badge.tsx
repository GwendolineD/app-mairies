import { cn } from "@/lib/utils/cn";
import { ACCESS_STATUS_LABELS } from "@/lib/constants/access-status";
import type { AccessStatus } from "@/lib/types";

const STATUS_CLASS: Record<AccessStatus, string> = {
  inactive: "bg-muted/15 text-muted",
  trial: "bg-orange/15 text-orange",
  active: "bg-mint/15 text-mint",
};

type Props = {
  status: AccessStatus;
  className?: string;
};

export function AccessStatusBadge({ status, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        STATUS_CLASS[status],
        className,
      )}
    >
      {ACCESS_STATUS_LABELS[status]}
    </span>
  );
}
