"use client";

import { Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useOnboardingCommuneName } from "./onboarding-commune-context";
import { OnboardingSlideFrame } from "./onboarding-slide-frame";
import type { OnboardingSlideId } from "./onboarding-slide-content";

type Props = {
  slide: OnboardingSlideId;
  communeName?: string;
};

export function InfoPopover({ slide, communeName: communeNameProp }: Props) {
  const communeNameFromContext = useOnboardingCommuneName();
  const communeName = communeNameProp ?? communeNameFromContext;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label="En savoir plus sur cette section"
            className="inline-flex cursor-pointer items-center justify-center rounded-full p-1 text-muted transition hover:bg-warm hover:text-text"
          >
            <Info className="size-4" />
          </button>
        }
      />
      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={8}
        className="w-[min(calc(100vw-2rem),24rem)] max-h-[min(80dvh,28rem)] gap-0 overflow-hidden p-0"
      >
        <OnboardingSlideFrame slide={slide} communeName={communeName} />
      </PopoverContent>
    </Popover>
  );
}
