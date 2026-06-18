"use client";

import { useState } from "react";
import { format, isValid, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  /** Earliest selectable date (yyyy-MM-dd). Dates before this are disabled. */
  minDate?: string;
};

function parseValue(value: string): Date | undefined {
  if (!value) return undefined;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : undefined;
}

export function DatePickerField({
  value,
  onChange,
  placeholder = "Choisir une date",
  className,
  id,
  minDate,
}: Props) {
  const [open, setOpen] = useState(false);
  const selected = parseValue(value);
  const minSelectable = minDate ? parseValue(minDate) : undefined;
  const currentYear = new Date().getFullYear();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        render={
          <button
            type="button"
            className={cn(
              "flex w-fit min-w-0 cursor-pointer items-center gap-2 rounded-sm border border-border bg-surface px-4 py-2.5 text-left text-sm font-medium whitespace-nowrap outline-none transition hover:border-purple/30 focus-visible:border-purple focus-visible:ring-2 focus-visible:ring-purple/20",
              !value && "text-subtle",
              value && "text-text",
              className,
            )}
          />
        }
      >
        <CalendarIcon className="size-4 shrink-0 text-muted" aria-hidden />
        <span className="truncate">
          {selected
            ? format(selected, "d MMMM yyyy", { locale: fr })
            : placeholder}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-auto gap-0 p-0" align="start" sideOffset={8}>
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (date) {
              onChange(format(date, "yyyy-MM-dd"));
              setOpen(false);
            }
          }}
          disabled={minSelectable ? { before: minSelectable } : undefined}
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
              onChange(format(new Date(), "yyyy-MM-dd"));
              setOpen(false);
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
                setOpen(false);
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
