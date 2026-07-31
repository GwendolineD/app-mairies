import { cn } from "@/lib/utils/cn";
import type { BackofficeContentType } from "@/lib/utils/backoffice-contenus-params";
import { BACKOFFICE_CONTENT_TYPE_LABELS } from "@/lib/utils/backoffice-contenus-params";

const TYPE_CLASS: Record<BackofficeContentType, string> = {
  announcement: "bg-coral/10 text-coral",
  initiative: "bg-mint/25 text-mint",
  event: "bg-orange/10 text-orange",
};

type Props = {
  contentType: BackofficeContentType;
  className?: string;
};

export function ContentTypeBadge({ contentType, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center rounded-full px-2.5 text-xs font-semibold leading-none",
        TYPE_CLASS[contentType],
        className,
      )}
    >
      {BACKOFFICE_CONTENT_TYPE_LABELS[contentType]}
    </span>
  );
}
