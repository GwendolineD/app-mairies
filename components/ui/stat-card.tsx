import Link from "next/link";
import { cn } from "@/lib/utils/cn";

type Props = {
  label: string;
  value: number | string;
  href?: string;
  hint?: string;
  /** Design-system color token for the value, e.g. "purple", "coral". */
  accent?:
    | "purple"
    | "coral"
    | "orange"
    | "aqua"
    | "mint"
    | "turquoise"
    | "text";
  className?: string;
};

const accentText: Record<NonNullable<Props["accent"]>, string> = {
  purple: "text-purple",
  coral: "text-coral",
  orange: "text-orange",
  aqua: "text-aqua",
  mint: "text-mint",
  turquoise: "text-turquoise",
  text: "text-text",
};

export function StatCard({
  label,
  value,
  href,
  hint,
  accent = "text",
  className,
}: Props) {
  const body = (
    <>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className={cn("text-5xl font-bold leading-tight", accentText[accent])}>
        {value}
      </p>
      {hint ? (
        <p className="text-xs font-medium text-muted">{hint}</p>
      ) : null}
    </>
  );

  const base =
    "flex flex-col gap-1 rounded-3xl border border-border/60 bg-surface p-5 shadow-card";

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          base,
          "cursor-pointer transition hover:scale-[1.02] hover:shadow-elevated",
          className,
        )}
      >
        {body}
      </Link>
    );
  }

  return <div className={cn(base, className)}>{body}</div>;
}
