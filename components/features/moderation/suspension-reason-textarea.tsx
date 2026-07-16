"use client";

import { Textarea } from "@/components/ui/form-field";
import {
  SUSPENSION_REASON_MAX,
  SUSPENSION_REASON_MIN,
} from "@/lib/constants/moderation";

type Props = {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  disabled?: boolean;
};

export function SuspensionReasonTextarea({
  value,
  onChange,
  rows = 3,
  disabled = false,
}: Props) {
  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Textarea
          value={value}
          onChange={(event) =>
            onChange(event.target.value.slice(0, SUSPENSION_REASON_MAX))
          }
          maxLength={SUSPENSION_REASON_MAX}
          placeholder="Expliquez brièvement la raison de la suspension."
          rows={rows}
          disabled={disabled}
          className="resize-none pb-8 field-sizing-fixed"
        />
        <span className="pointer-events-none absolute right-3 bottom-2 text-xs font-medium text-subtle">
          {value.length}/{SUSPENSION_REASON_MAX}
        </span>
      </div>
      <p className="text-xs font-medium text-subtle">
        {SUSPENSION_REASON_MIN} caractères minimum.
      </p>
    </div>
  );
}
