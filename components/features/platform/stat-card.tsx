import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

type Props = {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "purple" | "aqua" | "mint" | "coral" | "orange" | "text";
  className?: string;
};

const TONE: Record<NonNullable<Props["tone"]>, string> = {
  purple: "text-purple",
  aqua: "text-aqua",
  mint: "text-mint",
  coral: "text-coral",
  orange: "text-orange",
  text: "text-text",
};

export function StatCard({ label, value, hint, tone = "purple", className }: Props) {
  return (
    <Card className={cn("space-y-1 p-5", className)}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className={cn("text-4xl font-bold leading-none", TONE[tone])}>{value}</p>
      {hint ? <p className="text-xs font-medium text-muted">{hint}</p> : null}
    </Card>
  );
}
