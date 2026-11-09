"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { NumberStepper } from "@/components/ui/number-stepper";
import { CONTENT_ICONS } from "@/lib/constants/content-icons";
import { MAX_EVENT_GUESTS, type EventEngagementKind } from "@/lib/constants/event-guests";
import { formatOwnPartyLabel, formatPartySizeLabel } from "@/lib/utils/event-headcount";

const COPY: Record<
  EventEngagementKind,
  { title: string; confirm: string; cancel: string }
> = {
  participant: {
    title: "Je participe",
    confirm: "Confirmer ma participation",
    cancel: "Me désinscrire",
  },
  volunteer: {
    title: "Je deviens bénévole",
    confirm: "Confirmer mon coup de main",
    cancel: "Retirer mon inscription",
  },
};

type Props = {
  kind: EventEngagementKind;
  open: boolean;
  onClose: () => void;
  /** null = not registered yet (create mode); number = edit mode. */
  initialGuestsCount: number | null;
  pending: boolean;
  error: string | null;
  onConfirm: (guestsCount: number) => void;
  onCancelRegistration: () => void;
};

/**
 * Single modal for creating and editing a registration. Defaults to 0
 * companions so the solo case stays "tap, tap".
 */
export function EventEngagementModal({
  kind,
  open,
  onClose,
  initialGuestsCount,
  pending,
  error,
  onConfirm,
  onCancelRegistration,
}: Props) {
  const isEdit = initialGuestsCount !== null;
  const [guestsCount, setGuestsCount] = useState(initialGuestsCount ?? 0);

  useEffect(() => {
    if (open) setGuestsCount(initialGuestsCount ?? 0);
  }, [open, initialGuestsCount]);

  const copy = COPY[kind];
  const Icon =
    kind === "participant" ? CONTENT_ICONS.eventParticipants : CONTENT_ICONS.eventVolunteers;
  const atMax = guestsCount >= MAX_EVENT_GUESTS;
  const unchanged = isEdit && guestsCount === initialGuestsCount;
  const confirmLabel =
    guestsCount > 0 ? `Confirmer · ${formatPartySizeLabel(guestsCount)}` : copy.confirm;

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeDisabled={pending}
      showCloseButton
      size="sm"
      title={
        <span className="flex items-center gap-2">
          <Icon className="size-5 shrink-0 text-orange" aria-hidden />
          {copy.title}
        </span>
      }
      footer={
        <div className="flex items-center justify-between gap-2">
          {isEdit ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted hover:text-coral"
              onClick={onCancelRegistration}
              disabled={pending}
            >
              {copy.cancel}
            </Button>
          ) : (
            <span />
          )}
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => onConfirm(guestsCount)}
            disabled={pending || unchanged}
          >
            {pending ? "Un instant…" : confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="space-y-1 text-center">
          <p className="text-base font-semibold text-text">Personnes qui m&apos;accompagnent</p>
          <p className="text-sm font-medium text-muted">Pas besoin de donner leurs noms.</p>
        </div>

        <NumberStepper
          value={guestsCount}
          onChange={setGuestsCount}
          min={0}
          max={MAX_EVENT_GUESTS}
          label="Personnes qui m'accompagnent"
          disabled={pending}
        />

        <p className="text-center text-sm font-semibold text-purple" aria-live="polite">
          {formatOwnPartyLabel(guestsCount)}
        </p>

        {atMax ? (
          <p className="text-center text-xs font-medium text-subtle">
            Pour un groupe plus grand, contactez l&apos;organisateur·ice.
          </p>
        ) : null}

        {error ? <p className="text-center text-xs text-coral">{error}</p> : null}
      </div>
    </Modal>
  );
}
