"use client";

import { useState, useTransition } from "react";
import { CalendarCheck } from "lucide-react";
import { toggleEventParticipation } from "@/lib/actions/events";
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

  return (
    <div className="relative">
      <GradientButton
        type="button"
        gradient="events"
        className={cn(
          "w-full",
          participating && "opacity-90 ring-2 ring-orange/30",
          className,
        )}
        disabled={isPending}
        onClick={handleToggle}
      >
        <CalendarCheck
          className={cn("size-4", participating && "fill-white")}
          aria-hidden
        />
        {isPending
          ? "Inscription…"
          : participating
            ? "Inscrit·e"
            : "Je participe"}
      </GradientButton>

      {toastMessage ? (
        <div className="absolute -top-12 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-sm bg-text px-3 py-1.5 text-xs font-semibold text-white shadow-card animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      ) : null}
    </div>
  );
}
