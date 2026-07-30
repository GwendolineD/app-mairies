"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MultilineText } from "@/components/ui/multiline-text";
import { cn } from "@/lib/utils/cn";
import { getTrimmedMultilineText } from "@/lib/utils/multiline-text";
import { formatDay } from "@/lib/datetime";
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

type MembershipStatusBadgeProps = {
  status: MembershipStatus;
  suspendedAt?: string | null;
  suspendedByName?: string | null;
  suspendedReason?: string | null;
  className?: string;
};

type BanBadgeProps = {
  bannedAt?: string | null;
  banReason?: string | null;
  className?: string;
};

type MemberStatusBadgesProps = MembershipStatusBadgeProps & BanBadgeProps;

function buildSuspendedLabel(
  suspendedAt?: string | null,
  suspendedByName?: string | null,
): string {
  const parts = ["Suspendu"];
  if (suspendedAt) {
    parts.push(`le ${formatDay(suspendedAt)}`);
  }
  if (suspendedByName) {
    parts.push(`par ${suspendedByName}`);
  }
  return parts.join(" ");
}

function buildBannedLabel(bannedAt?: string | null): string {
  if (bannedAt) {
    return `Banni le ${formatDay(bannedAt)}`;
  }
  return "Banni";
}

function ReasonPopoverBadge({
  label,
  badgeClass,
  ariaLabel,
  title,
  reason,
  emptyReasonLabel,
}: {
  label: string;
  badgeClass: string;
  ariaLabel: string;
  title: string;
  reason?: string | null;
  emptyReasonLabel: string;
}) {
  return (
    <Popover>
      <PopoverTrigger
        nativeButton
        render={
          <button
            type="button"
            className={cn(badgeClass, "cursor-pointer hover:bg-coral/25")}
            aria-label={ariaLabel}
          >
            {label}
          </button>
        }
      />
      <PopoverContent side="left" className="max-w-xs space-y-1 text-xs">
        <p className="font-semibold text-text">{title}</p>
        {getTrimmedMultilineText(reason) ? (
          <MultilineText
            text={reason}
            className="font-medium leading-4 text-muted"
          />
        ) : (
          <p className="font-medium leading-4 text-muted">{emptyReasonLabel}</p>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function BanBadge({ bannedAt, banReason, className }: BanBadgeProps) {
  if (!bannedAt) return null;

  const label = buildBannedLabel(bannedAt);
  const badgeClass = cn(
    "inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-[10px] leading-tight font-semibold bg-coral/25 text-coral",
    className,
  );

  return (
    <ReasonPopoverBadge
      label={label}
      badgeClass={badgeClass}
      ariaLabel="Voir le motif de bannissement"
      title="Motif de bannissement"
      reason={banReason}
      emptyReasonLabel="Aucun motif enregistré."
    />
  );
}

export function MembershipStatusBadge({
  status,
  suspendedAt,
  suspendedByName,
  suspendedReason,
  className,
}: MembershipStatusBadgeProps) {
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

  return (
    <ReasonPopoverBadge
      label={label}
      badgeClass={badgeClass}
      ariaLabel="Voir le motif de suspension"
      title="Motif de suspension"
      reason={suspendedReason}
      emptyReasonLabel="Aucun motif enregistré."
    />
  );
}

export function MemberStatusBadges({
  status,
  suspendedAt,
  suspendedByName,
  suspendedReason,
  bannedAt,
  banReason,
  className,
}: MemberStatusBadgesProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {bannedAt ? (
        <BanBadge key="ban" bannedAt={bannedAt} banReason={banReason} />
      ) : null}
      <MembershipStatusBadge
        key="membership-status"
        status={status}
        suspendedAt={suspendedAt}
        suspendedByName={suspendedByName}
        suspendedReason={suspendedReason}
      />
    </div>
  );
}
