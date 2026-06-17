"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteInitiative } from "@/lib/actions/initiatives";
import { ROUTES } from "@/lib/constants/routes";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

type Props = {
  initiativeId: string;
  open: boolean;
  onClose: () => void;
};

export function DeleteInitiativeModal({ initiativeId, open, onClose }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await deleteInitiative(initiativeId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onClose();
      router.push(ROUTES.initiatives.list);
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Supprimer l'initiative"
      size="md"
      closeDisabled={pending}
    >
      <div className="space-y-4">
        <p className="text-sm font-medium leading-5 text-muted">
          Votre initiative sera définitivement supprimée, ainsi que les soutiens
          associés. Cette action est irréversible.
        </p>

        {error ? <p className="text-xs text-coral">{error}</p> : null}

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
            className="w-fit shrink-0"
            disabled={pending}
            onClick={handleConfirm}
          >
            {pending ? "Suppression…" : "Supprimer l'initiative"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
