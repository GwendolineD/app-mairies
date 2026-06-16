"use client";

import { useEffect, useState } from "react";

/** Keeps a mobile bottom sheet above the virtual keyboard using Visual Viewport. */
export function useVisualViewportBottomSheet(active: boolean) {
  const [style, setStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!active || typeof window === "undefined") return;

    const viewport = window.visualViewport;
    if (!viewport) return;

    const update = () => {
      if (window.matchMedia("(min-width: 640px)").matches) {
        setStyle({});
        return;
      }

      const keyboardInset = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop,
      );

      setStyle({
        bottom: `${keyboardInset}px`,
        maxHeight: `${Math.round(viewport.height * 0.92)}px`,
      });
    };

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    window.addEventListener("resize", update);

    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [active]);

  return style;
}
