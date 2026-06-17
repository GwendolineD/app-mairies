"use client";

import { useCallback, useState, useTransition } from "react";
import { OnboardingModal } from "./onboarding-modal";
import { markOnboardingSeen } from "@/lib/actions/onboarding";

type Props = {
  hasSeenOnboarding: boolean;
  communeName: string;
};

export function OnboardingModalHost({ hasSeenOnboarding, communeName }: Props) {
  const [open, setOpen] = useState(!hasSeenOnboarding);
  const [, startTransition] = useTransition();

  const handleComplete = useCallback(() => {
    setOpen(false);
    startTransition(() => {
      markOnboardingSeen();
    });
  }, []);

  if (!open) return null;

  return (
    <OnboardingModal
      open={open}
      onComplete={handleComplete}
      communeName={communeName}
    />
  );
}
