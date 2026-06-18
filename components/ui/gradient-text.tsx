import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

type Gradient = "hero" | "demande" | "offre" | "initiative" | "events";

const gradientVar: Record<Gradient, string> = {
  hero: "var(--gradient-hero)",
  demande: "var(--gradient-demande)",
  offre: "var(--gradient-offre)",
  initiative: "var(--gradient-initiative)",
  events: "var(--gradient-events)",
};

type Props = {
  gradient?: Gradient;
  className?: string;
  children: ReactNode;
};

export function GradientText({
  gradient = "hero",
  className,
  children,
}: Props) {
  return (
    <span
      className={cn("inline-block", className)}
      style={{
        backgroundImage: gradientVar[gradient],
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        WebkitTextFillColor: "transparent",
        color: "transparent",
      }}
    >
      {children}
    </span>
  );
}
