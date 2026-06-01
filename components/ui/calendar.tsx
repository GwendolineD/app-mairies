"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, type DayPickerProps, type DropdownProps } from "react-day-picker";
import { fr } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import "react-day-picker/style.css";

export type CalendarProps = DayPickerProps;

function CalendarSelectDropdown({
  options,
  value,
  onChange,
  "aria-label": ariaLabel,
}: DropdownProps) {
  const handleValueChange = (newValue: string | null) => {
    if (!onChange || newValue === null) return;
    onChange({
      target: { value: newValue },
    } as React.ChangeEvent<HTMLSelectElement>);
  };

  return (
    <Select value={value?.toString()} onValueChange={handleValueChange}>
      <SelectTrigger aria-label={ariaLabel} size="sm" className="min-w-0">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="start">
        <SelectGroup>
          {options?.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value.toString()}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  navLayout = "around",
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={fr}
      navLayout={navLayout}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col gap-2",
        month: "flex flex-col gap-3",
        month_caption: "flex items-center justify-center gap-2",
        caption_label: "text-sm font-semibold text-text hidden",
        nav: "flex items-center gap-1",
        button_previous: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "size-7",
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "size-7",
        ),
        dropdowns: "flex items-center justify-center gap-2 text-sm font-medium",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "w-9 text-center text-[0.7rem] font-semibold uppercase text-muted",
        week: "mt-1 flex w-full",
        day: "relative size-9 p-0 text-center text-sm",
        day_button: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "size-9 p-0 font-medium aria-selected:opacity-100",
        ),
        selected:
          "rounded-sm bg-purple text-white hover:bg-purple hover:text-white focus:bg-purple focus:text-white",
        today:
          "font-bold text-text [&>button]:relative [&>button]:after:absolute [&>button]:after:bottom-0.5 [&>button]:after:left-1/2 [&>button]:after:size-1 [&>button]:after:-translate-x-1/2 [&>button]:after:rounded-full [&>button]:after:bg-purple",
        outside: "text-subtle opacity-40",
        disabled: "text-subtle opacity-30",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          ),
        Dropdown: CalendarSelectDropdown,
      }}
      {...props}
    />
  );
}
