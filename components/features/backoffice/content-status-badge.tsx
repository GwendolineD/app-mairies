import { cn } from "@/lib/utils/cn";
import {
  BACKOFFICE_CONTENT_STATUS_LABELS,
  type BackofficeContentStatus,
} from "@/lib/utils/backoffice-contenus-params";

const STATUS_CLASS: Record<BackofficeContentStatus, string> = {
  ouverte: "bg-mint/25 text-mint",
  pourvue: "bg-turquoise/10 text-turquoise",
  archivee: "bg-muted/15 text-muted",
  expiree: "bg-orange/10 text-orange",
  active: "bg-mint/25 text-mint",
  archived: "bg-muted/15 text-muted",
};

type Props = {
  status: string;
  className?: string;
};

export function ContentStatusBadge({ status, className }: Props) {
  const label =
    BACKOFFICE_CONTENT_STATUS_LABELS[
      status as BackofficeContentStatus
    ] ?? status;
  const statusClass =
    STATUS_CLASS[status as BackofficeContentStatus] ??
    "bg-soft-pink text-text";

  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center rounded-full px-2.5 text-xs font-semibold leading-none",
        statusClass,
        className,
      )}
    >
      {label}
    </span>
  );
}
