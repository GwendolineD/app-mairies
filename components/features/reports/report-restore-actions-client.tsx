"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  reactivateContent,
  reactivateMembership,
} from "@/lib/actions/moderation";
import type { ConversationContextType } from "@/lib/types";

type RestorableResolution = "content_suspended" | "user_suspended";

type Props = {
  resolution: RestorableResolution;
  contextType: string;
  contextId: string;
  authorMembershipId: string | null;
  onRestored?: (info: { at: string; actorName: string }) => void;
};

const restoreButtonClassName =
  "border-mint bg-surface text-mint hover:bg-mint/10 hover:opacity-100";

const RESTORE_COPY: Record<
  RestorableResolution,
  {
    buttonLabel: string;
    title: string;
    disclaimer: string;
    confirmLabel: string;
  }
> = {
  content_suspended: {
    buttonLabel: "Restaurer le contenu",
    title: "Restaurer le contenu",
    disclaimer:
      "Le contenu redeviendra visible pour les résident·es de la commune. Les signalements associés resteront marqués comme traités.",
    confirmLabel: "Confirmer la restauration",
  },
  user_suspended: {
    buttonLabel: "Restaurer l'auteur",
    title: "Restaurer l'auteur",
    disclaimer:
      "L'auteur·rice pourra de nouveau accéder à la commune et publier du contenu. Les signalements associés resteront marqués comme traités.",
    confirmLabel: "Confirmer la restauration",
  },
};

export function ReportRestoreActionsClient({
  resolution,
  contextType,
  contextId,
  authorMembershipId,
  onRestored,
}: Props) {
  const router = useRouter();
  const [busy, run] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copy = RESTORE_COPY[resolution];
  const canRestore =
    resolution === "content_suspended"
      ? contextType !== "user"
      : authorMembershipId !== null;

  if (!canRestore) {
    return <span aria-hidden className="flex-1" />;
  }

  function handleClose() {
    if (busy) return;
    setOpen(false);
    setError(null);
  }

  function handleConfirmRestore() {
    run(async () => {
      setError(null);

      if (resolution === "content_suspended") {
        const result = await reactivateContent(
          contextType as ConversationContextType,
          contextId,
        );
        if (!result.success) {
          setError(result.error ?? "Impossible de restaurer le contenu.");
          return;
        }
        if (result.restoredAt && result.actorName) {
          onRestored?.({
            at: result.restoredAt,
            actorName: result.actorName,
          });
        }
      } else if (authorMembershipId) {
        const result = await reactivateMembership(authorMembershipId);
        if (!result.success) {
          setError(result.error ?? "Impossible de restaurer l'auteur.");
          return;
        }
        if (result.restoredAt && result.actorName) {
          onRestored?.({
            at: result.restoredAt,
            actorName: result.actorName,
          });
        }
      }

      handleClose();
      router.refresh();
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="xs"
        className={restoreButtonClassName}
        disabled={busy}
        onClick={() => setOpen(true)}
      >
        {copy.buttonLabel}
      </Button>

      <Modal
        open={open}
        onClose={handleClose}
        title={copy.title}
        closeDisabled={busy}
      >
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted">{copy.disclaimer}</p>

          {error ? (
            <p className="text-sm font-medium text-coral">{error}</p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={handleClose}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={busy}
              onClick={handleConfirmRestore}
            >
              {copy.confirmLabel}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
