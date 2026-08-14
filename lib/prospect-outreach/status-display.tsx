import type {
  ProspectOutreachStatus,
  ProspectOutcome,
} from "@/lib/prospect-outreach/types";
import {
  PROSPECT_FIRST_CONTACT_TYPE_LABELS,
  PROSPECT_OUTCOME_LABELS,
  PROSPECT_OUTREACH_STATUS_LABELS,
  PROSPECT_OUTREACH_STATUSES,
  PROSPECT_OUTCOMES,
  PROSPECT_FIRST_CONTACT_TYPES,
} from "@/lib/prospect-outreach/types";
import { cn } from "@/lib/utils/cn";

export function ProspectOutreachStatusBadge({
  status,
  outcome,
  className,
}: {
  status: ProspectOutreachStatus;
  outcome?: ProspectOutcome | null;
  className?: string;
}) {
  const tone =
    status === "completed"
      ? "bg-mint/15 text-mint"
      : status === "in_progress"
        ? "bg-soft-pink text-purple"
        : "bg-warm text-muted";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tone,
        className,
      )}
    >
      {PROSPECT_OUTREACH_STATUS_LABELS[status]}
      {status === "completed" && outcome
        ? ` · ${PROSPECT_OUTCOME_LABELS[outcome]}`
        : null}
    </span>
  );
}

export {
  PROSPECT_FIRST_CONTACT_TYPE_LABELS,
  PROSPECT_OUTCOME_LABELS,
  PROSPECT_OUTREACH_STATUS_LABELS,
  PROSPECT_OUTREACH_STATUSES,
  PROSPECT_OUTCOMES,
  PROSPECT_FIRST_CONTACT_TYPES,
};
