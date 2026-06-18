import { getAnnouncementTypeConfig } from "@/lib/constants/announcement-types";
import { cn } from "@/lib/utils/cn";
import { AnnouncementTypeIcon } from "@/components/ui/announcement-type-icon";

type Props = {
  type: string;
  className?: string;
};

export function AnnouncementTypePastille({ type, className }: Props) {
  const config = getAnnouncementTypeConfig(type);
  if (!config) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-card",
        config.gradient,
        className,
      )}
    >
      <AnnouncementTypeIcon type={type} className="size-3" />
      <span className="font-extrabold">{config.label}</span>
    </span>
  );
}

/** @deprecated Use `AnnouncementTypePastille` */
export const TypePastille = AnnouncementTypePastille;
