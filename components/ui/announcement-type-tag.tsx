import { ANNOUNCEMENT_TYPES } from "@/lib/constants/announcement-types";
import { cn } from "@/lib/utils/cn";
import { CategoryTag } from "@/components/ui/category-tag";

type Props = {
  type: string;
  className?: string;
};

const TYPE_STYLES = {
  demande: "bg-orange/10 text-orange",
  offre: "bg-aqua/10 text-aqua",
} as const;

export function AnnouncementTypeTag({ type, className }: Props) {
  const config = ANNOUNCEMENT_TYPES.find((t) => t.slug === type);
  const styleKey = type === "demande" || type === "offre" ? type : "demande";

  return (
    <CategoryTag
      label={config?.label ?? type}
      className={cn(TYPE_STYLES[styleKey], className)}
    />
  );
}
