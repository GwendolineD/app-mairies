"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type Props = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  /** Accessible name of the value (eg. "Personnes qui m'accompagnent"). */
  label: string;
  disabled?: boolean;
  className?: string;
};

/**
 * Bounded − / + stepper. No free-text input: no keyboard on mobile, value is
 * always within [min, max]. Buttons stay >= 44px on touch screens.
 */
export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = Number.POSITIVE_INFINITY,
  label,
  disabled = false,
  className,
}: Props) {
  const canDecrement = !disabled && value > min;
  const canIncrement = !disabled && value < max;

  return (
    <div
      className={cn("flex items-center justify-center gap-4", className)}
      role="group"
      aria-label={label}
    >
      <Button
        type="button"
        variant="secondary"
        size="icon-lg"
        className="size-12 rounded-full md:size-11"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={!canDecrement}
        aria-label="Retirer une personne"
      >
        <Minus className="size-5" aria-hidden />
      </Button>
      <span
        className="min-w-10 text-center text-3xl font-bold tabular-nums text-text"
        aria-live="polite"
        aria-atomic="true"
      >
        {value}
      </span>
      <Button
        type="button"
        variant="secondary"
        size="icon-lg"
        className="size-12 rounded-full md:size-11"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={!canIncrement}
        aria-label="Ajouter une personne"
      >
        <Plus className="size-5" aria-hidden />
      </Button>
    </div>
  );
}
