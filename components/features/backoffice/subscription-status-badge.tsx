import { cn } from "@/lib/utils/cn";
import { SUBSCRIPTION_STATUS_LABELS } from "@/lib/constants/subscription-status";
import type { SubscriptionStatus } from "@/lib/types";

const STATUS_CLASS: Record<SubscriptionStatus, string> = {
  inactive: "bg-muted/15 text-muted",
  trial: "bg-orange/15 text-orange",
  active: "bg-mint/15 text-mint",
};

type Props = {
  status: SubscriptionStatus;
  className?: string;
};

export function SubscriptionStatusBadge({ status, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        STATUS_CLASS[status],
        className,
      )}
    >
      {SUBSCRIPTION_STATUS_LABELS[status]}
    </span>
  );
}
