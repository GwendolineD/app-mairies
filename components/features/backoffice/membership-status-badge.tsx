"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils/cn";
import { formatDay } from "@/lib/utils/date";
import type { MembershipStatus } from "@/lib/types";

const STATUS_LABELS: Record<MembershipStatus, string> = {
  active: "Active",
  suspended: "Suspendue",
  left: "Partie",
};

const STATUS_CLASS: Record<MembershipStatus, string> = {
  active: "bg-mint/25 text-mint",
  suspended: "bg-coral/15 text-coral",
  left: "bg-muted/15 text-muted",
};

type Props = {
  status: MembershipStatus;
  suspendedAt?: string | null;
  suspendedByName?: string | null;
  suspendedReason?: string | null;
  className?: string;
};

function buildSuspendedLabel(
  suspendedAt?: string | null,
  suspendedByName?: string | null,
): string {
  const parts = ["Suspendue"];
  if (suspendedAt) {
    parts.push(formatDay(suspendedAt));
  }
  if (suspendedByName) {
    parts.push(`par ${suspendedByName}`);
  }
  return parts.join(" · ");
}

export function MembershipStatusBadge({
  status,
  suspendedAt,
  suspendedByName,
  suspendedReason,
  className,
}: Props) {
  const label =
    status === "suspended"
      ? buildSuspendedLabel(suspendedAt, suspendedByName)
      : STATUS_LABELS[status];

  const badgeClass = cn(
    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
    status === "suspended" && "max-w-full text-[10px] leading-tight",
    STATUS_CLASS[status],
    className,
  );

  if (status !== "suspended") {
    return <span className={badgeClass}>{label}</span>;
  }

  const reasonText = suspendedReason?.trim() || "Aucun motif enregistré.";

  return (
    <Popover>
      <PopoverTrigger
        nativeButton
        render={
          <button
            type="button"
            className={cn(badgeClass, "cursor-pointer hover:bg-coral/25")}
            aria-label="Voir le motif de suspension"
          >
            {label}
          </button>
        }
      />
      <PopoverContent side="left" className="max-w-xs space-y-1 text-xs">
        <p className="font-semibold text-text">Motif de suspension</p>
        <p className="font-medium leading-4 text-muted">{reasonText}</p>
      </PopoverContent>
    </Popover>
  );
}
