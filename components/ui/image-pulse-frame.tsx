"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

type Props = {
  children: React.ReactNode;
  className?: string;
  /** Reset placeholder when the image source changes (e.g. card photo URL). */
  resetKey?: string;
};

/** Warm pulse placeholder until the nested image finishes loading. */
export function ImagePulseFrame({ children, className, resetKey }: Props) {
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const markLoaded = useCallback(() => {
    setLoaded(true);
  }, []);

  useEffect(() => {
    setLoaded(false);
    const img = ref.current?.querySelector("img");
    if (!img) return;

    if (img.complete && img.naturalWidth > 0) {
      setLoaded(true);
      return;
    }

    img.addEventListener("load", markLoaded);
    return () => img.removeEventListener("load", markLoaded);
  }, [markLoaded, resetKey]);

  return (
    <div
      ref={ref}
      className={cn("relative", !loaded && "bg-warm animate-pulse", className)}
      onLoadCapture={markLoaded}
    >
      {children}
    </div>
  );
}
