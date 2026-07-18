"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { getOnboardingSlideBackground } from "./onboarding-slide-background";
import { OnboardingSlideContent, type OnboardingSlideId } from "./onboarding-slide-content";

type Props = {
  slide: OnboardingSlideId;
  communeName?: string;
  className?: string;
  /** Mobile only — used by the accueil info popover. */
  hideIllustrationOnMobile?: boolean;
  footer?: ReactNode;
  header?: ReactNode;
};

/** Shared slide shell: background illustration + padded content (modal & info popover). */
export function OnboardingSlideFrame({
  slide,
  communeName,
  className,
  hideIllustrationOnMobile = false,
  footer,
  header,
}: Props) {
  const slideBackground = getOnboardingSlideBackground(slide);

  return (
    <div
      className={cn(
        "relative flex min-h-0 flex-col",
        hideIllustrationOnMobile && "max-md:bg-none!",
        slideBackground.className,
        className,
      )}
      style={slideBackground.style}
    >
      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto pr-5 pb-4 pl-4 sm:pr-6 sm:pb-5 sm:pl-5",
          header ? "pt-4 sm:pt-5" : "pt-8 sm:pt-10",
          footer && "pb-2",
        )}
      >
        {header}
        <OnboardingSlideContent slide={slide} communeName={communeName} />
      </div>
      {footer}
    </div>
  );
}
