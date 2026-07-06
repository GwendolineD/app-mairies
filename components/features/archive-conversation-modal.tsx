"use client";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  pending?: boolean;
};

export function ArchiveConversationModal({
  open,
  onClose,
  onConfirm,
  pending = false,
}: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Supprimer la conversation ?"
      size="md"
      closeDisabled={pending}
    >
      <div className="space-y-4">
        <p className="text-sm font-medium leading-5 text-muted">
          La conversation sera déplacée dans la corbeille et conservée 30 jours.
          Vous pourrez la restaurer depuis l&apos;onglet Corbeille.
        </p>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={onClose}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? "Suppression…" : "Supprimer"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
