"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom" | "right";
  className?: string;
};

export function Tooltip({
  content,
  children,
  side = "top",
  className,
}: TooltipProps) {
  return (
    <span className={cn("group/tooltip relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 rounded-sm border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-text opacity-0 shadow-card transition-opacity duration-150 group-hover/tooltip:opacity-100",
          side === "top" && "bottom-full left-1/2 mb-2 -translate-x-1/2",
          side === "bottom" && "top-full left-1/2 mt-2 -translate-x-1/2",
          side === "right" && "top-1/2 left-full ml-2 -translate-y-1/2",
        )}
      >
        {content}
      </span>
    </span>
  );
}
