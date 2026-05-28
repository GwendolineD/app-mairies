import { cn } from "@/lib/utils/cn";
import { CategoryTag } from "@/components/ui/category-tag";

type Props = {
  type: string;
  className?: string;
};

export function AnnouncementTypeTag({ type, className }: Props) {
  const isDemande = type === "demande";

  return (
    <CategoryTag
      label={isDemande ? "Demande" : "Offre"}
      className={cn(
        isDemande ? "bg-orange/10 text-orange" : "bg-aqua/10 text-aqua",
        className,
      )}
    />
  );
}
