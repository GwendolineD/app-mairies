"use client";

import { useEffect, useState } from "react";
import { formatMediumDate, formatRelativeTime } from "@/lib/datetime";
import { cn } from "@/lib/utils/cn";

type Props = {
  iso: string;
  className?: string;
};

/** Relative label after mount; stable date on SSR to avoid hydration mismatches. */
export function RelativeTime({ iso, className }: Props) {
  const [label, setLabel] = useState(() => formatMediumDate(iso));

  useEffect(() => {
    setLabel(formatRelativeTime(iso));
  }, [iso]);

  return (
    <span className={cn(className)} suppressHydrationWarning>
      {label}
    </span>
  );
}
