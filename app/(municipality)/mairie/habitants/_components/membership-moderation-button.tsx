"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/form-field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  suspendMembershipByStaff,
  reactivateMembership,
} from "@/lib/actions/moderation";
import type { MembershipStatus } from "@/lib/types";

type Props = {
  membershipId: string;
  status: MembershipStatus;
  isSelf: boolean;
};

export function MembershipModerationButton({
  membershipId,
  status,
  isSelf,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isSuspend = status === "active";
  const suspendDisabled = isPending || (isSuspend && isSelf);

  function handleClose() {
    if (isPending) return;
    setOpen(false);
    setReason("");
    setError(null);
  }

  function handleConfirm() {
    if (isSuspend) {
      const trimmedReason = reason.trim();
      if (!trimmedReason) {
        setError("Merci d'indiquer une raison de suspension.");
        return;
      }
    }

    startTransition(async () => {
      const result = isSuspend
        ? await suspendMembershipByStaff(membershipId, reason.trim())
        : await reactivateMembership(membershipId);

      if (!result.success) {
        setError(result.error ?? "Une erreur est survenue.");
        return;
      }

      handleClose();
      router.refresh();
    });
  }

  if (status !== "active" && status !== "suspended") return null;

  const actionButton = (
    <Button
      type="button"
      variant="secondary"
      size="xs"
      className={
        isSuspend
          ? "border-coral bg-surface text-coral hover:bg-coral/10"
          : undefined
      }
      disabled={suspendDisabled}
      onClick={() => setOpen(true)}
    >
      {isSuspend ? "Suspendre" : "Restaurer"}
    </Button>
  );

  return (
    <>
      {isSuspend && isSelf ? (
        <Popover>
          <PopoverTrigger
            openOnHover
            delay={200}
            closeDelay={100}
            nativeButton={false}
            render={<span className="inline-flex cursor-not-allowed">{actionButton}</span>}
          />
          <PopoverContent side="left" className="max-w-xs text-xs font-medium leading-4 text-muted">
            Vous ne pouvez pas suspendre votre propre compte.
          </PopoverContent>
        </Popover>
      ) : (
        actionButton
      )}

      <Modal
        open={open}
        onClose={handleClose}
        title={isSuspend ? "Suspendre l'habitant·e" : "Restaurer l'habitant·e"}
        closeDisabled={isPending}
      >
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted">
            {isSuspend
              ? "Cette action bloque l'accès de l'habitant·e à la commune. Il ou elle sera redirigé·e vers la page de suspension lors de sa prochaine connexion."
              : "L'habitant·e retrouvera l'accès à la commune et pourra de nouveau publier des annonces, initiatives et événements."}
          </p>

          {isSuspend ? (
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-text">Raison</span>
              <Textarea
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  setError(null);
                }}
                placeholder="Expliquez brièvement la raison de la suspension."
                rows={3}
              />
            </label>
          ) : null}

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
              variant={isSuspend ? "danger" : "primary"}
              size="sm"
              disabled={isPending}
              onClick={handleConfirm}
            >
              {isSuspend ? "Confirmer la suspension" : "Confirmer la restauration"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
