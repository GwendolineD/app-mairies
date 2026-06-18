"use client";

import { useEffect, useState } from "react";
import { formatRelativeTime, formatShortDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils";

type Props = {
  iso: string;
  className?: string;
};

/** Relative label after mount; stable date on SSR to avoid hydration mismatches. */
export function RelativeTime({ iso, className }: Props) {
  const [label, setLabel] = useState(() => formatShortDate(iso));

  useEffect(() => {
    setLabel(formatRelativeTime(iso));
  }, [iso]);

  return (
    <span className={cn(className)} suppressHydrationWarning>
      {label}
    </span>
  );
}
