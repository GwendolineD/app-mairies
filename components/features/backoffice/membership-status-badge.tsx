import { cn } from "@/lib/utils/cn";
import type { MembershipStatus } from "@/lib/types";

const STATUS_LABELS: Record<MembershipStatus, string> = {
  active: "Active",
  suspended: "Suspendue",
  left: "Partie",
};

const STATUS_CLASS: Record<MembershipStatus, string> = {
  active: "bg-mint/15 text-mint",
  suspended: "bg-coral/15 text-coral",
  left: "bg-muted/15 text-muted",
};

type Props = {
  status: MembershipStatus;
  className?: string;
};

export function MembershipStatusBadge({ status, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        STATUS_CLASS[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
