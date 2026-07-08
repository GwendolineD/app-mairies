"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { OutcomeChoiceOptions } from "@/components/features/outcome-choice-options";
import { softDeleteAnnouncement } from "@/lib/actions/announcements";
import type { AnnouncementType } from "@/lib/constants/announcement-types";
import {
  getAnnouncementOutcomeCopy,
  type OutcomeReason,
} from "@/lib/constants/content-outcomes";
import { ROUTES } from "@/lib/constants/routes";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

type Props = {
  announcementId: string;
  announcementType: AnnouncementType;
  open: boolean;
  onClose: () => void;
};

export function DeleteAnnouncementModal({
  announcementId,
  announcementType,
  open,
  onClose,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<OutcomeReason | null>(null);
  const [pending, startTransition] = useTransition();
  const copy = getAnnouncementOutcomeCopy(announcementType);

  function handleClose() {
    if (pending) return;
    setOutcome(null);
    setError(null);
    onClose();
  }

  function handleConfirm() {
    if (!outcome) return;
    setError(null);
    startTransition(async () => {
      const result = await softDeleteAnnouncement(announcementId, outcome);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setOutcome(null);
      onClose();
      router.push(ROUTES.annonces.list);
    });
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Supprimer l'annonce"
      size="md"
      closeDisabled={pending}
    >
      <div className="space-y-4">
        <OutcomeChoiceOptions
          question={copy.question}
          fulfilledLabel={copy.fulfilled}
          unfulfilledLabel={copy.unfulfilled}
          value={outcome}
          onChange={setOutcome}
          disabled={pending}
        />

        <p className="text-sm font-medium leading-5 text-muted">
          Votre annonce sera immédiatement retirée des résultats.
        </p>

        {error ? <p className="text-xs text-coral">{error}</p> : null}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={handleClose}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            className="w-fit shrink-0"
            disabled={pending || !outcome}
            onClick={handleConfirm}
          >
            {pending ? "Suppression…" : "Supprimer l'annonce"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
