"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  buildInAppHref,
  trackInAppHref,
} from "@/lib/navigation/in-app-history";

function InAppHistoryTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.toString();

  useEffect(() => {
    trackInAppHref(buildInAppHref(pathname, search));
  }, [pathname, search]);

  return null;
}

/** Tracks pathname + query changes to maintain a reliable in-app back stack. */
export function InAppHistoryTracker() {
  return (
    <Suspense fallback={null}>
      <InAppHistoryTrackerInner />
    </Suspense>
  );
}
