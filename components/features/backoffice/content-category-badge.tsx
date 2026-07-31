import { CategoryIconBadge } from "@/components/ui/category-icon-badge";
import { getCategoryBySlug } from "@/lib/constants/announcement-categories";
import { getInitiativeCategoryBySlug } from "@/lib/constants/initiative-categories";
import type { BackofficeContentType } from "@/lib/utils/backoffice-contenus-params";
import { cn } from "@/lib/utils/cn";

type Props = {
  contentType: BackofficeContentType;
  categorySlug: string | null;
  className?: string;
};

export function ContentCategoryBadge({
  contentType,
  categorySlug,
  className,
}: Props) {
  if (!categorySlug) return null;

  const category =
    contentType === "announcement"
      ? getCategoryBySlug(categorySlug)
      : getInitiativeCategoryBySlug(categorySlug);

  if (!category) return null;

  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center gap-1 rounded-full pr-2 pl-0.5 text-xs font-semibold leading-none",
        className,
      )}
      style={{
        backgroundColor: `${category.colorHex}20`,
        color: category.colorHex,
      }}
    >
      <CategoryIconBadge
        colorHex={category.colorHex}
        Icon={category.Icon}
        className="size-4 rounded-full"
        iconClassName="size-2.5"
      />
      {category.label}
    </span>
  );
}
