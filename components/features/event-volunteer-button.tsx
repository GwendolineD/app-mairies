"use client";

import { useState, useTransition } from "react";
import { HandHeart } from "lucide-react";
import { toggleEventVolunteer } from "@/lib/actions/events";
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

  return (
    <div className="relative">
      <GradientButton
        type="button"
        gradient="events"
        className={cn(
          "w-full",
          volunteering && "opacity-90 ring-2 ring-orange/30",
          className,
        )}
        disabled={isPending}
        onClick={handleToggle}
      >
        <HandHeart
          className={cn("size-4", volunteering && "fill-white")}
          aria-hidden
        />
        {isPending
          ? "Inscription…"
          : volunteering
            ? "Je suis bénévole"
            : "Je deviens bénévole"}
      </GradientButton>

      {toastMessage ? (
        <div className="absolute -top-12 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-sm bg-text px-3 py-1.5 text-xs font-semibold text-white shadow-card animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      ) : null}
    </div>
  );
}
