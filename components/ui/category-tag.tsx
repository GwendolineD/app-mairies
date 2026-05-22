import { cn } from "@/lib/utils/cn";

type Props = {
  label: string;
  className?: string;
};

export function CategoryTag({ label, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-soft-pink px-3 py-1 text-xs font-semibold text-text",
        className,
      )}
    >
      {label}
    </span>
  );
}
