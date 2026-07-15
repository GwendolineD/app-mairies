"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { OutcomeChoiceOptions } from "@/components/features/outcome-choice-options";
import { deleteEvent } from "@/lib/actions/events";
import {
  getEventOutcomeCopy,
  type OutcomeReason,
} from "@/lib/constants/content-outcomes";
import { ROUTES } from "@/lib/constants/routes";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

type Props = {
  eventId: string;
  open: boolean;
  onClose: () => void;
  redirectHref?: string;
};

export function DeleteEventModal({
  eventId,
  open,
  onClose,
  redirectHref = ROUTES.evenements.list,
}: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<OutcomeReason | null>(null);
  const copy = getEventOutcomeCopy();

  function handleClose() {
    if (deleting) return;
    setOutcome(null);
    setError(null);
    onClose();
  }

  async function handleDelete() {
    if (!outcome) return;
    setDeleting(true);
    setError(null);
    const result = await deleteEvent(eventId, outcome);
    setDeleting(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setOutcome(null);
    onClose();
    router.push(redirectHref);
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      closeDisabled={deleting}
      title="Supprimer l'événement"
      showCloseButton
      size="sm"
    >
      <div className="space-y-4">
        <OutcomeChoiceOptions
          question={copy.question}
          fulfilledLabel={copy.fulfilled}
          unfulfilledLabel={copy.unfulfilled}
          value={outcome}
          onChange={setOutcome}
          disabled={deleting}
        />

        <p className="text-sm font-medium text-muted">
          Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est
          irréversible.
        </p>

        {error ? <p className="text-xs text-coral">{error}</p> : null}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={deleting}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleDelete}
            disabled={deleting || !outcome}
          >
            {deleting ? "Suppression…" : "Supprimer"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
