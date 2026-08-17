"use client";

/**
 * Single UI entry point for date selection — do not use native `type="date"` inputs.
 */

import { useState, type ReactNode } from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";

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

  function handleClear(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    onChange("");
    setOpen(false);
  }

  const fieldShellClassName = cn(
    "flex h-11 md:h-8 w-full min-w-0 items-center rounded-sm border border-border bg-surface text-sm font-medium transition hover:border-purple/30 focus-within:border-purple focus-within:ring-2 focus-within:ring-purple/20",
    className,
  );

  const triggerButtonClassName =
    appearance === "inline"
      ? cn(
          "flex min-w-0 flex-1 cursor-pointer items-center gap-2 bg-transparent text-left text-sm font-medium outline-none",
          !value && "text-subtle",
          value && "text-text",
        )
      : cn(
          "flex min-h-0 min-w-0 flex-1 cursor-pointer items-center gap-2 bg-transparent px-2.5 text-left text-sm font-medium outline-none",
          !value && "text-subtle",
          value && "text-text",
        );

  const clearButton = value ? (
    <button
      type="button"
      onClick={handleClear}
      className="mr-1 inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-sm text-muted transition hover:bg-warm hover:text-text"
      aria-label="Effacer la date"
    >
      <X className="size-3.5" aria-hidden />
    </button>
  ) : null;

  const trigger = (
    <PopoverTrigger
      id={id}
      aria-label={ariaLabel}
      render={<button type="button" className={triggerButtonClassName} />}
    >
      <CalendarIcon className="size-4 shrink-0 text-muted" aria-hidden />
      <span className="min-w-0 flex-1 truncate text-left">{labelText}</span>
    </PopoverTrigger>
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
      {appearance === "inline" ? (
        <div className={cn("flex min-w-0 flex-1 items-center gap-1", className)}>
          {trigger}
          {clearButton}
        </div>
      ) : (
        <div className={fieldShellClassName}>
          {trigger}
          {clearButton}
        </div>
      )}
    </DatePickerPopover>
  );
}
