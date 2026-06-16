import { cn } from "@/lib/utils/cn";

type Props = {
  label: string;
  colorHex?: string;
  className?: string;
  /**
   * Adds a 1px border in the exact same opaque tint as the background.
   * Uses color-mix on `--surface` so the border does not stack alpha on top of the fill.
   */
  borderMatchBackground?: boolean;
};

/** Opaque pastel equivalent to `${hex}20` on the surface token. */
function categoryFillOnSurface(hex: string): string {
  return `color-mix(in srgb, ${hex} 12.5%, var(--surface))`;
}

export function CategoryTag({
  label,
  colorHex,
  className,
  borderMatchBackground = false,
}: Props) {
  const style = colorHex
    ? (() => {
        const fill = borderMatchBackground
          ? categoryFillOnSurface(colorHex)
          : undefined;

        if (fill) {
          return {
            backgroundColor: fill,
            color: colorHex,
            border: `1px solid ${fill}`,
          };
        }

        return {
          backgroundColor: `${colorHex}20`,
          color: colorHex,
        };
      })()
    : undefined;

  return (
    <span
      className={cn(
        "inline-flex box-border items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        !colorHex && "bg-soft-pink text-text",
        className,
      )}
      style={style}
    >
      {label}
    </span>
  );
}
