import { cn } from "@/lib/utils/cn";

type Props = {
  label: string;
  colorHex?: string;
  className?: string;
};

export function CategoryTag({ label, colorHex, className }: Props) {
  const style = colorHex
    ? {
        backgroundColor: `${colorHex}20`,
        color: colorHex,
      }
    : undefined;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        !colorHex && "bg-soft-pink text-text",
        className,
      )}
      style={style}
    >
      {label}
    </span>
  );
}
