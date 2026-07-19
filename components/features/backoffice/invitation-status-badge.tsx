import { cn } from "@/lib/utils/cn";
import type { InvitationDerivedStatus } from "@/lib/utils/backoffice-invitations-params";
import { INVITATION_DERIVED_STATUS_LABELS } from "@/lib/utils/backoffice-invitations-params";

const STATUS_CLASS: Record<InvitationDerivedStatus, string> = {
  pending: "bg-orange/10 text-orange",
  accepted: "bg-mint/25 text-mint",
  expired: "bg-muted/15 text-muted",
};

type Props = {
  status: InvitationDerivedStatus;
  className?: string;
};

export function InvitationStatusBadge({ status, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        STATUS_CLASS[status],
        className,
      )}
    >
      {INVITATION_DERIVED_STATUS_LABELS[status]}
    </span>
  );
}
