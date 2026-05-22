import { cn } from "@/lib/utils/cn";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

const variants: Record<Variant, string> = {
  primary:
    "gradient-hero text-white shadow-md hover:opacity-95 disabled:opacity-50",
  secondary:
    "bg-surface text-text border border-border hover:bg-warm disabled:opacity-50",
  ghost: "text-muted hover:text-text hover:bg-warm disabled:opacity-50",
  danger: "bg-coral text-white hover:opacity-90 disabled:opacity-50",
};

export function Button({
  className,
  variant = "primary",
  ...props
}: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
