"use client";

import { useState, useMemo } from "react";
import { ChevronDown, Clock } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  step?: number;
};

function generateTimeOptions(step: number): string[] {
  const options: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += step) {
      const hh = h.toString().padStart(2, "0");
      const mm = m.toString().padStart(2, "0");
      options.push(`${hh}:${mm}`);
    }
  }
  return options;
}

export function TimePickerField({
  value,
  onChange,
  placeholder = "Heure",
  className,
  id,
  step = 15,
}: Props) {
  const [open, setOpen] = useState(false);
  const timeOptions = useMemo(() => generateTimeOptions(step), [step]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        render={
          <button
            type="button"
            className={cn(
              "flex w-fit min-w-0 cursor-pointer items-center justify-between gap-2 rounded-sm border border-border bg-surface px-4 py-2.5 text-left text-sm font-medium whitespace-nowrap outline-none transition hover:border-purple/30 focus-visible:border-purple focus-visible:ring-2 focus-visible:ring-purple/20",
              !value && "text-subtle",
              value && "text-text",
              className,
            )}
          />
        }
      >
        <Clock className="size-4 shrink-0 text-muted" aria-hidden />
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown className="size-4 shrink-0 text-muted" aria-hidden />
      </PopoverTrigger>
      <PopoverContent
        className="max-h-64 w-32 overflow-y-auto p-1"
        align="start"
        sideOffset={8}
      >
        <div className="flex flex-col">
          {timeOptions.map((time) => (
            <button
              key={time}
              type="button"
              onClick={() => {
                onChange(time);
                setOpen(false);
              }}
              className={cn(
                "flex w-full cursor-pointer items-center rounded-sm px-3 py-2 text-sm font-medium transition",
                value === time
                  ? "bg-soft-pink text-purple"
                  : "text-text hover:bg-warm",
              )}
            >
              {time}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
