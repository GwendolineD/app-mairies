import { formatGuestsLabel } from "@/lib/utils/event-headcount";
import { cn } from "@/lib/utils/cn";

type Props = {
  guestsCount: number;
  className?: string;
};

/** "+2" pill next to a member name when they declared companions. */
export function EventGuestsChip({ guestsCount, className }: Props) {
  if (guestsCount <= 0) return null;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full bg-soft-pink px-2 py-0.5 text-xs font-semibold text-purple",
        className,
      )}
      aria-label={formatGuestsLabel(guestsCount)}
      title={formatGuestsLabel(guestsCount)}
    >
      +{guestsCount}
    </span>
  );
}
