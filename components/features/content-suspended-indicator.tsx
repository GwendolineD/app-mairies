import { AlertTriangle } from "lucide-react";
import { formatShortDate } from "@/lib/datetime";
import { cn } from "@/lib/utils/cn";
import { getTrimmedMultilineText } from "@/lib/utils/multiline-text";

export function ContentSuspendedBanner({
  suspendedAt,
  suspensionReason,
  className,
}: {
  suspendedAt: string;
  suspensionReason?: string | null;
  className?: string;
}) {
  const reason = getTrimmedMultilineText(suspensionReason);

  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-3 rounded-md border border-coral/35 bg-coral/10 px-4 py-3",
        className,
      )}
    >
      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-coral" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-coral">
          Suspendu le {formatShortDate(suspendedAt)}
        </p>
        {reason ? (
          <div className="mt-1 grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 text-xs">
            <span className="font-semibold text-coral">Raison :</span>
            <span className="whitespace-pre-wrap break-words font-medium text-coral/90">
              {reason}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ContentSuspendedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "absolute right-2 top-2 z-10 rounded-full bg-coral px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-card",
        className,
      )}
    >
      Suspendu
    </span>
  );
}
