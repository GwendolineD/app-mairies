"use client";

import { cn } from "@/lib/utils/cn";
import { getOnboardingSlideBackground } from "./onboarding-slide-background";
import { OnboardingSlideContent, type OnboardingSlideId } from "./onboarding-slide-content";

type Props = {
  slide: OnboardingSlideId;
  communeName?: string;
  className?: string;
};

/** Shared slide shell: background illustration + padded content (modal & info popover). */
export function OnboardingSlideFrame({ slide, communeName, className }: Props) {
  const slideBackground = getOnboardingSlideBackground(slide);

  return (
    <div
      className={cn(
        "relative overflow-y-auto pt-8 pr-5 pb-4 pl-4 sm:pt-10 sm:pr-6 sm:pb-5 sm:pl-5",
        slideBackground.className,
        className,
      )}
      style={slideBackground.style}
    >
      <OnboardingSlideContent slide={slide} communeName={communeName} />
    </div>
  );
}
