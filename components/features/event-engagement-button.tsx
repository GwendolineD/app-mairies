"use client";

import { useState, useTransition } from "react";
import { EventEngagementModal } from "@/components/features/event-engagement-modal";
import {
  ENGAGEMENT_ACTIVE_BUTTON_CLASS,
  ENGAGEMENT_ACTIVE_ICON_CLASS,
} from "@/components/features/engagement-button-styles";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/ui/gradient-button";
import { cancelEventEngagement, setEventEngagement } from "@/lib/actions/events";
import { CONTENT_ICONS } from "@/lib/constants/content-icons";
import type { EventEngagementKind } from "@/lib/constants/event-guests";
import { formatPartySizeLabel } from "@/lib/utils/event-headcount";
import { cn } from "@/lib/utils/cn";

const COPY: Record<
  EventEngagementKind,
  {
    cta: string;
    registered: string;
    toastCreated: string;
    toastUpdated: string;
    toastCancelled: string;
  }
> = {
  participant: {
    cta: "Je veux participer",
    registered: "Inscrit·e",
    toastCreated: "Participation confirmée, à bientôt !",
    toastUpdated: "Nombre de personnes mis à jour",
    toastCancelled: "Participation retirée",
  },
  volunteer: {
    cta: "Je deviens bénévole",
    registered: "Bénévole",
    toastCreated: "Merci pour votre engagement !",
    toastUpdated: "Nombre de personnes mis à jour",
    toastCancelled: "Inscription bénévole retirée",
  },
};

type Props = {
  kind: EventEngagementKind;
  eventId: string;
  /** null = not registered; number = registered with N companions. */
  initialGuestsCount: number | null;
  className?: string;
};

/**
 * Entry point for participating / volunteering. The click never mutates
 * directly: it opens the modal (create or edit). Un-registering lives inside
 * the modal so a stray tap on mobile cannot drop a registration.
 */
export function EventEngagementButton({
  kind,
  eventId,
  initialGuestsCount,
  className,
}: Props) {
  const [guestsCount, setGuestsCount] = useState<number | null>(initialGuestsCount);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const copy = COPY[kind];
  const Icon =
    kind === "participant" ? CONTENT_ICONS.eventParticipants : CONTENT_ICONS.eventVolunteers;
  const registered = guestsCount !== null;

  function showToast(message: string) {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  }

  function openModal() {
    setError(null);
    setModalOpen(true);
  }

  function handleConfirm(nextGuests: number) {
    const wasRegistered = registered;
    startTransition(async () => {
      const result = await setEventEngagement({ kind, eventId, guestsCount: nextGuests });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setGuestsCount(result.guestsCount);
      setModalOpen(false);
      showToast(wasRegistered ? copy.toastUpdated : copy.toastCreated);
    });
  }

  function handleCancelRegistration() {
    startTransition(async () => {
      const result = await cancelEventEngagement({ kind, eventId });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setGuestsCount(null);
      setModalOpen(false);
      showToast(copy.toastCancelled);
    });
  }

  const registeredLabel =
    guestsCount !== null && guestsCount > 0
      ? `${copy.registered} · ${formatPartySizeLabel(guestsCount)}`
      : copy.registered;

  return (
    <div className="relative">
      {registered ? (
        <Button
          type="button"
          variant="secondary"
          className={cn("w-full cursor-pointer", ENGAGEMENT_ACTIVE_BUTTON_CLASS, className)}
          onClick={openModal}
          aria-haspopup="dialog"
        >
          <Icon className={cn("size-4", ENGAGEMENT_ACTIVE_ICON_CLASS)} aria-hidden />
          {registeredLabel}
        </Button>
      ) : (
        <GradientButton
          type="button"
          gradient="hero"
          className={cn("w-full", className)}
          onClick={openModal}
          aria-haspopup="dialog"
        >
          <Icon className="size-4" aria-hidden />
          {copy.cta}
        </GradientButton>
      )}

      <EventEngagementModal
        kind={kind}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialGuestsCount={guestsCount}
        pending={isPending}
        error={error}
        onConfirm={handleConfirm}
        onCancelRegistration={handleCancelRegistration}
      />

      {toastMessage ? (
        <div className="absolute -top-12 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-sm bg-text px-3 py-1.5 text-xs font-semibold text-white shadow-card animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      ) : null}
    </div>
  );
}
