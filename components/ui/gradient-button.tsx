import { cn } from "@/lib/utils/cn";
import type { ButtonHTMLAttributes } from "react";

type Gradient = "hero" | "demande" | "offre" | "initiative" | "events";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  gradient?: Gradient;
};

const gradientClass: Record<Gradient, string> = {
  hero: "gradient-hero",
  demande: "gradient-demande",
  offre: "gradient-offre",
  initiative: "gradient-initiative",
  events: "gradient-events",
};

export function GradientButton({
  gradient = "hero",
  className,
  ...props
}: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-md transition hover:opacity-95 disabled:opacity-50",
        gradientClass[gradient],
        className,
      )}
      {...props}
    />
  );
}
