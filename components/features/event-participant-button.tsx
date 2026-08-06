"use client";

import { useState, useTransition } from "react";
import { CONTENT_ICONS } from "@/lib/constants/content-icons";
import { toggleEventParticipation } from "@/lib/actions/events";
import {
  ENGAGEMENT_ACTIVE_BUTTON_CLASS,
  ENGAGEMENT_ACTIVE_ICON_CLASS,
} from "@/components/features/engagement-button-styles";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/ui/gradient-button";
import { cn } from "@/lib/utils/cn";

type Props = {
  eventId: string;
  initialParticipating: boolean;
  className?: string;
};

export function EventParticipantButton({
  eventId,
  initialParticipating,
  className,
}: Props) {
  const [participating, setParticipating] = useState(initialParticipating);
  const [isPending, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function handleToggle() {
    const next = !participating;
    setParticipating(next);

    startTransition(async () => {
      const result = await toggleEventParticipation(eventId);
      if (result.error) {
        setParticipating(!next);
        return;
      }
      setParticipating(result.participating);
      setToastMessage(
        result.participating
          ? "Participation confirmée !"
          : "Participation retirée",
      );
      setTimeout(() => setToastMessage(null), 3000);
    });
  }

  const label = isPending
    ? "Inscription…"
    : participating
      ? "Je suis inscrit·e"
      : "Je veux participer";

  const ParticipantIcon = CONTENT_ICONS.eventParticipants;

  return (
    <div className="relative">
      {participating ? (
        <Button
          type="button"
          variant="secondary"
          className={cn(
            "w-full cursor-pointer",
            ENGAGEMENT_ACTIVE_BUTTON_CLASS,
            className,
          )}
          disabled={isPending}
          onClick={handleToggle}
        >
          <ParticipantIcon className={cn("size-4", ENGAGEMENT_ACTIVE_ICON_CLASS)} aria-hidden />
          {label}
        </Button>
      ) : (
        <GradientButton
          type="button"
          gradient="hero"
          className={cn("w-full", className)}
          disabled={isPending}
          onClick={handleToggle}
        >
          <ParticipantIcon className="size-4" aria-hidden />
          {label}
        </GradientButton>
      )}

      {toastMessage ? (
        <div className="absolute -top-12 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-sm bg-text px-3 py-1.5 text-xs font-semibold text-white shadow-card animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      ) : null}
    </div>
  );
}
