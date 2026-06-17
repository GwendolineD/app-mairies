"use client";

import { Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { OnboardingSlideContent, type OnboardingSlideId } from "./onboarding-slide-content";

type Props = {
  slide: OnboardingSlideId;
  communeName?: string;
};

export function InfoPopover({ slide, communeName }: Props) {
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
        className="w-80 p-4"
      >
        <OnboardingSlideContent
          slide={slide}
          communeName={communeName}
          mode="compact"
        />
      </PopoverContent>
    </Popover>
  );
}
