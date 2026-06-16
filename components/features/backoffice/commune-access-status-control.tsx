"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setCommuneAccessStatus } from "@/lib/actions/platform";
import { AccessStatusBadge } from "@/components/features/backoffice/access-status-badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ALL_ACCESS_STATUSES,
  ACCESS_STATUS_CHANGE_DISCLAIMERS,
  ACCESS_STATUS_LABELS,
} from "@/lib/constants/access-status";
import type { AccessStatus } from "@/lib/types";

type Props = {
  communeId: string;
  currentStatus: AccessStatus;
};

export function CommuneAccessStatusControl({
  communeId,
  currentStatus,
}: Props) {
  const router = useRouter();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<AccessStatus | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const otherStatuses = ALL_ACCESS_STATUSES.filter(
    (status) => status !== currentStatus,
  );

  function handlePickStatus(status: AccessStatus) {
    setPopoverOpen(false);
    setPendingStatus(status);
    setError(null);
  }

  function handleCloseModal() {
    if (isPending) return;
    setPendingStatus(null);
    setError(null);
  }

  function handleConfirm() {
    if (!pendingStatus) return;

    startTransition(async () => {
      const result = await setCommuneAccessStatus(communeId, pendingStatus);
      if (!result.success) {
        setError(result.error ?? "Impossible de modifier le statut.");
        return;
      }

      handleCloseModal();
      router.refresh();
    });
  }

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-purple/40"
              aria-label="Modifier le statut d'accès"
            />
          }
        >
          <AccessStatusBadge status={currentStatus} />
        </PopoverTrigger>

        <PopoverContent align="end" sideOffset={8} className="w-48 p-1">
          <ul role="listbox" aria-label="Statuts d'accès">
            {otherStatuses.map((status) => (
              <li key={status} role="presentation">
                <button
                  type="button"
                  role="option"
                  className="flex w-full cursor-pointer items-center rounded-sm px-3 py-2 text-sm font-medium text-text transition hover:bg-warm"
                  onClick={() => handlePickStatus(status)}
                >
                  {ACCESS_STATUS_LABELS[status]}
                </button>
              </li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>

      <Modal
        open={pendingStatus !== null}
        onClose={handleCloseModal}
        title={
          pendingStatus
            ? `Passer en ${ACCESS_STATUS_LABELS[pendingStatus]}`
            : "Modifier le statut"
        }
        closeDisabled={isPending}
      >
        {pendingStatus ? (
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted">
              {ACCESS_STATUS_CHANGE_DISCLAIMERS[pendingStatus]}
            </p>

            {error ? (
              <p className="text-sm font-medium text-coral" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                disabled={isPending}
                onClick={handleCloseModal}
              >
                Annuler
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={isPending}
                onClick={handleConfirm}
              >
                Confirmer
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
