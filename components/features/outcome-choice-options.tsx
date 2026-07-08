"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import type { OutcomeReason } from "@/lib/constants/content-outcomes";
import { cn } from "@/lib/utils/cn";

type Props = {
  question: string;
  fulfilledLabel: string;
  unfulfilledLabel: string;
  value: OutcomeReason | null;
  onChange: (value: OutcomeReason) => void;
  disabled?: boolean;
};

export function OutcomeChoiceOptions({
  question,
  fulfilledLabel,
  unfulfilledLabel,
  value,
  onChange,
  disabled = false,
}: Props) {
  const options: { outcome: OutcomeReason; label: string; icon: typeof CheckCircle2; iconClass: string }[] = [
    {
      outcome: "fulfilled",
      label: fulfilledLabel,
      icon: CheckCircle2,
      iconClass: "text-mint",
    },
    {
      outcome: "unfulfilled",
      label: unfulfilledLabel,
      icon: XCircle,
      iconClass: "text-coral",
    },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold leading-5 text-text">{question}</p>
      <div className="flex flex-col gap-2">
        {options.map(({ outcome, label, icon: Icon, iconClass }) => {
          const selected = value === outcome;
          return (
            <button
              key={outcome}
              type="button"
              disabled={disabled}
              onClick={() => onChange(outcome)}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-sm border px-4 py-3 text-left transition",
                "disabled:cursor-not-allowed disabled:opacity-50",
                selected
                  ? "border-purple bg-purple/5"
                  : "border-border bg-warm hover:border-purple/40",
              )}
            >
              <Icon className={cn("size-5 shrink-0", iconClass)} aria-hidden />
              <span className="text-sm font-medium text-text">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
