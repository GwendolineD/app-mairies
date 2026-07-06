"use client";

/**
 * Single UI entry point for date selection — do not use native `type="date"` inputs.
 */

import { useState, type ReactNode } from "react";
import { Calendar as CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  formatParisYmdFromDate,
  formatPickerDateLabel,
  parseDateOnly,
  todayParisYmd,
} from "@/lib/datetime";
import { cn } from "@/lib/utils/cn";

type DatePickerPopoverProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onChange: (value: string) => void;
  minDate?: string;
  maxDate?: string;
  children: ReactNode;
  align?: "start" | "center" | "end";
};

function parseValue(value: string): Date | undefined {
  if (!value) return undefined;
  const parsed = parseDateOnly(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function buildDisabledRange(minDate?: string, maxDate?: string) {
  const minSelectable = minDate ? parseValue(minDate) : undefined;
  const maxSelectable = maxDate ? parseValue(maxDate) : undefined;

  if (minSelectable && maxSelectable) {
    return { before: minSelectable, after: maxSelectable };
  }
  if (minSelectable) return { before: minSelectable };
  if (maxSelectable) return { after: maxSelectable };
  return undefined;
}

export function DatePickerPopover({
  open,
  onOpenChange,
  value,
  onChange,
  minDate,
  maxDate,
  children,
  align = "start",
}: DatePickerPopoverProps) {
  const selected = parseValue(value);
  const currentYear = new Date().getFullYear();
  const disabled = buildDisabledRange(minDate, maxDate);
  const minSelectable = minDate ? parseValue(minDate) : undefined;

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      {children}
      <PopoverContent className="w-auto gap-0 p-0" align={align} sideOffset={8}>
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (date) {
              onChange(formatParisYmdFromDate(date));
              onOpenChange(false);
            }
          }}
          disabled={disabled}
          captionLayout="dropdown"
          startMonth={new Date(currentYear - 1, 0)}
          endMonth={new Date(currentYear + 5, 11)}
          defaultMonth={selected ?? minSelectable ?? new Date()}
        />
        <div className="flex gap-2 border-t border-border p-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={() => {
              onChange(todayParisYmd());
              onOpenChange(false);
            }}
          >
            Aujourd&apos;hui
          </Button>
          {value ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange("");
                onOpenChange(false);
              }}
            >
              Effacer
            </Button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  /** Earliest selectable date (yyyy-MM-dd). Dates before this are disabled. */
  minDate?: string;
  /** Latest selectable date (yyyy-MM-dd). Dates after this are disabled. */
  maxDate?: string;
  /** Bordered field trigger (default) or borderless inline trigger for filter rows. */
  appearance?: "field" | "inline";
  /** Accessible label when no visible label is associated. */
  "aria-label"?: string;
};

export function DatePickerField({
  value,
  onChange,
  placeholder = "Choisir une date",
  className,
  id,
  minDate,
  maxDate,
  appearance = "field",
  "aria-label": ariaLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const labelText = value ? formatPickerDateLabel(value) : placeholder;

  const triggerClassName =
    appearance === "inline"
      ? cn(
          "flex flex-1 cursor-pointer items-center gap-2 text-left text-sm font-medium",
          !value && "text-subtle",
          value && "text-text",
          className,
        )
      : cn(
          "flex w-fit min-w-0 cursor-pointer items-center gap-2 rounded-sm border border-border bg-surface px-4 py-2.5 text-left text-sm font-medium whitespace-nowrap outline-none transition hover:border-purple/30 focus-visible:border-purple focus-visible:ring-2 focus-visible:ring-purple/20",
          !value && "text-subtle",
          value && "text-text",
          className,
        );

  return (
    <DatePickerPopover
      open={open}
      onOpenChange={setOpen}
      value={value}
      onChange={onChange}
      minDate={minDate}
      maxDate={maxDate}
    >
      <PopoverTrigger
        id={id}
        aria-label={ariaLabel}
        render={
          <button type="button" className={triggerClassName} />
        }
      >
        <CalendarIcon className="size-4 shrink-0 text-muted" aria-hidden />
        <span className={appearance === "inline" ? "flex-1 truncate" : "truncate"}>
          {labelText}
        </span>
      </PopoverTrigger>
    </DatePickerPopover>
  );
}
