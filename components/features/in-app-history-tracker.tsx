"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackInAppPathname } from "@/lib/navigation/in-app-history";

/** Tracks pathname changes to maintain a reliable in-app back stack. */
export function InAppHistoryTracker() {
  const pathname = usePathname();

  useEffect(() => {
    trackInAppPathname(pathname);
  }, [pathname]);

  return null;
}
