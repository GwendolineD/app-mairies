import { AlertTriangle } from "lucide-react";
import { formatShortDate } from "@/lib/datetime";
import { cn } from "@/lib/utils/cn";

export function ContentSuspendedBanner({
  suspendedAt,
  className,
}: {
  suspendedAt: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex items-center gap-3 rounded-md border border-coral/35 bg-coral/10 px-4 py-3",
        className,
      )}
    >
      <AlertTriangle className="size-5 shrink-0 text-coral" aria-hidden />
      <p className="text-sm font-semibold text-coral">
        Suspendu le {formatShortDate(suspendedAt)}
      </p>
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
