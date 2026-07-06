"use client";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  pending?: boolean;
};

export function DeleteConversationModal({
  open,
  onClose,
  onConfirm,
  pending = false,
}: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Supprimer définitivement"
      size="md"
      closeDisabled={pending}
    >
      <div className="space-y-4">
        <p className="text-sm font-medium leading-5 text-muted">
          Cette conversation sera définitivement supprimée. Cette action est
          irréversible.
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
