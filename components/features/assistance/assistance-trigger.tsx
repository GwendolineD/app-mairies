"use client";

import { LifeBuoy } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils/cn";

type Props = {
  variant: "sidebar" | "menu";
  collapsed?: boolean;
  onOpen: () => void;
};

const SIDEBAR_BUTTON_CLASS = (collapsed: boolean) =>
  cn(
    "flex w-full cursor-pointer items-center rounded-sm text-sm font-semibold text-text transition hover:bg-soft-pink/70",
    collapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3",
  );

export function AssistanceTrigger({ variant, collapsed = false, onOpen }: Props) {
  if (variant === "menu") {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="flex h-10 w-full cursor-pointer items-center gap-2.5 px-3 text-sm font-semibold text-text transition hover:bg-warm"
      >
        <LifeBuoy className="size-4 shrink-0 text-muted" aria-hidden />
        Assistance
      </button>
    );
  }

  const buttonClass = SIDEBAR_BUTTON_CLASS(collapsed);

  if (collapsed) {
    return (
      <Popover>
        <PopoverTrigger
          openOnHover
          delay={200}
          closeDelay={100}
          nativeButton={false}
          render={
            <button
              type="button"
              aria-label="Assistance"
              className={buttonClass}
              onClick={onOpen}
            />
          }
        >
          <LifeBuoy className="size-5 shrink-0 text-coral/85" aria-hidden />
        </PopoverTrigger>
        <PopoverContent
          side="right"
          align="center"
          sideOffset={8}
          className="w-auto min-w-0 gap-0 border-0 p-0 shadow-md ring-1 ring-foreground/10"
        >
          <span className="whitespace-nowrap px-2.5 py-1.5 text-sm font-semibold text-text">
            Assistance
          </span>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <button type="button" className={buttonClass} onClick={onOpen}>
      <LifeBuoy className="size-5 shrink-0 text-coral/85" aria-hidden />
      <span className="flex-1 text-left">Assistance</span>
    </button>
  );
}
