"use client";

import { useCallback, useEffect, useState } from "react";

export const PWA_PROMPT_DISMISSED_KEY = "vl:pwa-prompt-dismissed";

export type PwaPlatform = "ios" | "android" | "other";

type PwaInstallPromptState = {
  /** Banner: mobile, not standalone, not dismissed. */
  shouldShow: boolean;
  /** Profile card: mobile and not standalone (ignores dismiss). */
  showPermanent: boolean;
  platform: PwaPlatform;
  /** True after client-side eligibility checks run (avoids SSR flash). */
  isReady: boolean;
};

function detectPlatform(): PwaPlatform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "other";
}

function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px)").matches;
}

function readDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(PWA_PROMPT_DISMISSED_KEY) === "true";
  } catch {
    return false;
  }
}

function evaluatePromptState(): PwaInstallPromptState {
  const standalone = isStandaloneMode();
  const mobile = isMobileViewport();
  const dismissed = readDismissed();
  const eligible = mobile && !standalone;

  return {
    shouldShow: eligible && !dismissed,
    showPermanent: eligible,
    platform: detectPlatform(),
    isReady: true,
  };
}

export function usePwaInstallPrompt() {
  const [state, setState] = useState<PwaInstallPromptState>({
    shouldShow: false,
    showPermanent: false,
    platform: "other",
    isReady: false,
  });

  useEffect(() => {
    setState(evaluatePromptState());

    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const standaloneQuery = window.matchMedia("(display-mode: standalone)");

    const refresh = () => setState(evaluatePromptState());

    mobileQuery.addEventListener("change", refresh);
    standaloneQuery.addEventListener("change", refresh);

    return () => {
      mobileQuery.removeEventListener("change", refresh);
      standaloneQuery.removeEventListener("change", refresh);
    };
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(PWA_PROMPT_DISMISSED_KEY, "true");
    } catch {
      // ignore quota errors
    }
    setState((prev) => ({
      ...prev,
      shouldShow: false,
      isReady: true,
    }));
  }, []);

  return { ...state, dismiss };
}
