"use client";

import { useState, useTransition } from "react";
import { HandHeart } from "lucide-react";
import { toggleEventVolunteer } from "@/lib/actions/events";
import {
  ENGAGEMENT_ACTIVE_BUTTON_CLASS,
  ENGAGEMENT_ACTIVE_ICON_CLASS,
} from "@/components/features/engagement-button-styles";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/ui/gradient-button";
import { cn } from "@/lib/utils/cn";

type Props = {
  eventId: string;
  initialVolunteering: boolean;
  className?: string;
};

export function EventVolunteerButton({
  eventId,
  initialVolunteering,
  className,
}: Props) {
  const [volunteering, setVolunteering] = useState(initialVolunteering);
  const [isPending, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function handleToggle() {
    const nextVolunteering = !volunteering;
    setVolunteering(nextVolunteering);

    startTransition(async () => {
      const result = await toggleEventVolunteer(eventId);
      if (result.error) {
        setVolunteering(!nextVolunteering);
        return;
      }
      setVolunteering(result.volunteering);
      setToastMessage(
        result.volunteering
          ? "Merci pour votre engagement !"
          : "Inscription bénévole retirée",
      );
      setTimeout(() => setToastMessage(null), 3000);
    });
  }

  const label = isPending
    ? "Inscription…"
    : volunteering
      ? "Je suis bénévole"
      : "Je deviens bénévole";

  return (
    <div className="relative">
      {volunteering ? (
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
          <HandHeart className={cn("size-4", ENGAGEMENT_ACTIVE_ICON_CLASS)} aria-hidden />
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
          <HandHeart className="size-4" aria-hidden />
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
