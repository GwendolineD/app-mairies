"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  reactivateMembershipAction,
  restoreUserFromAllCommunesAction,
} from "@/lib/actions/platform-moderation";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

type Props = {
  mode: "membership" | "all";
  membershipId?: string;
  userId: string;
  label: string;
  disabled?: boolean;
};

export function RestoreUserButton({
  mode,
  membershipId,
  userId,
  label,
  disabled = false,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClose() {
    if (isPending) return;
    setOpen(false);
    setError(null);
  }

  function handleConfirm() {
    startTransition(async () => {
      const result =
        mode === "all"
          ? await restoreUserFromAllCommunesAction(userId)
          : await reactivateMembershipAction(membershipId!);

      if (!result.success) {
        setError(result.error ?? "Impossible de restaurer cet utilisateur.");
        return;
      }

      handleClose();
      router.refresh();
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="primary"
        className="px-4 py-2 text-xs"
        disabled={disabled || isPending}
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>

      <Modal
        open={open}
        onClose={handleClose}
        title={label}
        closeDisabled={isPending}
      >
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted">
            {mode === "all"
              ? "Cette action rétablit l'accès de l'utilisateur·rice à toutes les communes dont il ou elle était suspendu·e."
              : "Cette action rétablit l'accès de l'utilisateur·rice à cette commune."}
          </p>

          {error ? <p className="text-sm font-medium text-coral">{error}</p> : null}

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={handleClose}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={isPending}
              onClick={handleConfirm}
            >
              Confirmer la restauration
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
