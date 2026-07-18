import { getContentNudgeReason, type NudgeableContent } from "@/lib/utils/content-nudge";
import { cn } from "@/lib/utils/cn";

type Props = {
  content: NudgeableContent;
  className?: string;
};

export function ContentActionRequiredBadge({ content, className }: Props) {
  const reason = getContentNudgeReason(content);
  if (!reason) return null;

  return (
    <span
      className={cn(
        "absolute right-2 top-2 z-10 inline-flex items-center rounded-full bg-coral px-2.5 py-1 text-xs font-semibold text-white/95",
        className,
      )}
    >
      Action requise
    </span>
  );
}
