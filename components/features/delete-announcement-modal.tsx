"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { softDeleteAnnouncement } from "@/lib/actions/announcements";
import { ROUTES } from "@/lib/constants/routes";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

type Props = {
  announcementId: string;
  open: boolean;
  onClose: () => void;
};

export function DeleteAnnouncementModal({ announcementId, open, onClose }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await softDeleteAnnouncement(announcementId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onClose();
      router.push(ROUTES.annonces.list);
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Supprimer l'annonce" size="md" closeDisabled={pending}>
      <div className="space-y-4">
        <p className="text-sm font-medium leading-5 text-muted">
          Votre annonce sera immédiatement retirée des résultats.
          Elle sera définitivement supprimée après 30 jours.
          Cette action est irréversible passé ce délai.
        </p>

        {error ? <p className="text-xs text-coral">{error}</p> : null}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="danger"
            className="flex-1 py-2 text-sm"
            disabled={pending}
            onClick={handleConfirm}
          >
            {pending ? "Suppression…" : "Supprimer l'annonce"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="py-2 text-sm"
            disabled={pending}
            onClick={onClose}
          >
            Annuler
          </Button>
        </div>
      </div>
    </Modal>
  );
}
