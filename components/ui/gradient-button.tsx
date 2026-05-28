import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import type { ButtonHTMLAttributes } from "react";

type Gradient = "hero" | "demande" | "offre" | "initiative" | "events";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  gradient?: Gradient;
  href?: string;
};

const gradientClass: Record<Gradient, string> = {
  hero: "gradient-hero",
  demande: "gradient-demande",
  offre: "gradient-offre",
  initiative: "gradient-initiative",
  events: "gradient-events",
};

const baseClass =
  "inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-bold text-white shadow-card transition hover:opacity-95 disabled:opacity-50";

export function GradientButton({
  gradient = "hero",
  className,
  href,
  ...props
}: Props) {
  const classes = cn(baseClass, gradientClass[gradient], className);

  if (href) {
    return (
      <Link href={href} className={classes}>
        {props.children}
      </Link>
    );
  }

  return <button className={classes} {...props} />;
}
