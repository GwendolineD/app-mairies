import { CONTENT_TYPE_TAGS, type ContentTypeTagKey } from "@/lib/constants/content-types";
import { cn } from "@/lib/utils/cn";
import { CategoryTag } from "@/components/ui/category-tag";

type Props = {
  type: ContentTypeTagKey;
  className?: string;
};

export function ContentTypeTag({ type, className }: Props) {
  const config = CONTENT_TYPE_TAGS[type];
  return (
    <CategoryTag
      label={config.label}
      className={cn(config.className, className)}
    />
  );
}
