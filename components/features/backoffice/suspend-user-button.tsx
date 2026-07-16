"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  suspendMembershipAction,
  suspendUserFromAllCommunesAction,
} from "@/lib/actions/platform-moderation";
import { SuspensionReasonTextarea } from "@/components/features/moderation/suspension-reason-textarea";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { validateSuspensionReason } from "@/lib/constants/moderation";

type Props = {
  mode: "membership" | "all";
  membershipId?: string;
  userId: string;
  label: string;
  disabled?: boolean;
};

export function SuspendUserButton({
  mode,
  membershipId,
  userId,
  label,
  disabled = false,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClose() {
    if (isPending) return;
    setOpen(false);
    setReason("");
    setError(null);
  }

  function handleConfirm() {
    const validationError = validateSuspensionReason(reason);
    if (validationError) {
      setError(validationError);
      return;
    }

    startTransition(async () => {
      const result =
        mode === "all"
          ? await suspendUserFromAllCommunesAction(userId, reason.trim())
          : await suspendMembershipAction(membershipId!, reason.trim());

      if (!result.success) {
        setError(result.error ?? "Impossible de suspendre cet utilisateur.");
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
        variant="danger"
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
            Cette action bloque l&apos;accès à la commune concernée. L&apos;utilisateur·rice
            sera redirigé·e vers la page de suspension lors de sa prochaine connexion.
          </p>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-text">Raison</span>
            <SuspensionReasonTextarea
              value={reason}
              onChange={(value) => {
                setReason(value);
                setError(null);
              }}
              rows={4}
              disabled={isPending}
            />
          </label>

          {error ? <p className="text-sm font-medium text-coral">{error}</p> : null}

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={isPending}
              onClick={handleClose}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={isPending}
              onClick={handleConfirm}
            >
              Confirmer la suspension
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
