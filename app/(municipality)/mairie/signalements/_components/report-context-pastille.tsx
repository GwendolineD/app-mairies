import { CalendarDays, Sparkles } from "lucide-react";
import { AnnouncementTypePastille } from "@/components/ui/announcement-type-pastille";
import { cn } from "@/lib/utils/cn";

type Props = {
  contextType: string;
  announcementType?: string | null;
  className?: string;
};

const CONTENT_PASTILLES = {
  initiative: {
    label: "Initiative",
    gradient: "gradient-initiative",
    Icon: Sparkles,
  },
  event: {
    label: "Événement",
    gradient: "gradient-events",
    Icon: CalendarDays,
  },
} as const;

export function ReportContextPastille({
  contextType,
  announcementType,
  className,
}: Props) {
  if (contextType === "announcement" && announcementType) {
    return (
      <AnnouncementTypePastille type={announcementType} className={className} />
    );
  }

  const config =
    CONTENT_PASTILLES[contextType as keyof typeof CONTENT_PASTILLES];
  if (!config) return null;

  const { label, gradient, Icon } = config;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-card",
        gradient,
        className,
      )}
    >
      <Icon className="size-3" aria-hidden />
      <span className="font-extrabold">{label}</span>
    </span>
  );
}
