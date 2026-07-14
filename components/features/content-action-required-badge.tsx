import { getContentNudgeReason, type NudgeableContent } from "@/lib/utils/content-nudge";

type Props = {
  content: NudgeableContent;
};

export function ContentActionRequiredBadge({ content }: Props) {
  const reason = getContentNudgeReason(content);
  if (!reason) return null;

  return (
    <span className="inline-flex items-center rounded-full bg-coral/10 px-2 py-0.5 text-xs font-semibold text-coral">
      Action requise
    </span>
  );
}
