"use client";

import { useState, useTransition } from "react";
import { AlertTriangle } from "lucide-react";
import { leaveCommune } from "@/lib/actions/membership";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { Membership } from "@/lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  membership: Membership;
};

const STAFF_ROLES = new Set(["staff", "mayor"]);

const ROLE_LABELS: Record<string, string> = {
  staff: "administrateur",
  mayor: "maire",
};

export function LeaveCommuneModal({ open, onClose, membership }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const communeName = membership.commune?.name ?? "cette commune";
  const isStaffOrMayor = STAFF_ROLES.has(membership.role);

  function handleClose() {
    if (pending) return;
    setError(null);
    onClose();
  }

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await leaveCommune(membership.commune_id);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Quitter ${communeName} ?`}
      size="md"
      closeDisabled={pending}
    >
      <div className="space-y-4">
        <p className="text-sm leading-6 text-text">
          En quittant cette commune, vos publications et conversations seront
          supprimés. Vous perdrez l&apos;accès à l&apos;actualité de la
          commune.
        </p>

        {isStaffOrMayor ? (
          <div className="flex items-start gap-3 rounded-md bg-coral/10 p-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-coral" aria-hidden />
            <p className="text-sm font-medium text-coral">
              Vous êtes {ROLE_LABELS[membership.role] ?? "administrateur"} de
              cette commune. En quittant, vous perdrez vos droits
              d&apos;administration.
            </p>
          </div>
        ) : null}

        <p className="text-xs text-muted">
          Vous pourrez réadhérer à tout moment, mais votre contenu ne sera pas
          restauré.
        </p>

        {error ? (
          <p className="text-xs font-medium text-coral" role="alert">
            {error}
          </p>
        ) : null}

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
            disabled={pending}
            onClick={handleConfirm}
          >
            {pending ? "Départ en cours…" : "Quitter cette commune"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
