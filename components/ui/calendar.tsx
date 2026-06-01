"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, type DayPickerProps } from "react-day-picker";
import { fr } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

import "react-day-picker/style.css";

export type CalendarProps = DayPickerProps;

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={fr}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col gap-2",
        month: "flex flex-col gap-3",
        month_caption: "flex items-center justify-center gap-1 px-8 relative",
        caption_label: "text-sm font-semibold text-text hidden",
        nav: "flex items-center gap-1",
        button_previous: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "absolute left-0 size-7",
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "absolute right-0 size-7",
        ),
        dropdowns: "flex w-full items-center justify-center gap-2 text-sm font-medium",
        dropdown_root: "relative inline-flex items-center rounded-sm border border-border bg-surface",
        dropdown:
          "cursor-pointer appearance-none rounded-sm bg-surface py-1 pl-2 pr-7 text-sm font-medium text-text outline-none",
        months_dropdown: "",
        years_dropdown: "",
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
        today: "rounded-sm bg-soft-pink text-purple font-bold",
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
      }}
      {...props}
    />
  );
}
