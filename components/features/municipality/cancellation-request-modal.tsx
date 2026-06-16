"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cancelSubscription } from "@/lib/actions/cancellation";
import { formatShortDate } from "@/lib/utils/format-date";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

type Props = {
  communeId: string;
  subscriptionId: string;
  periodEndsAt: string;
  open: boolean;
  onClose: () => void;
};

export function CancellationRequestModal({
  communeId,
  subscriptionId,
  periodEndsAt,
  open,
  onClose,
}: Props) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClose() {
    if (isPending) return;
    setComment("");
    setError(null);
    onClose();
  }

  function handleSubmit() {
    if (comment.trim().length < 10) {
      setError("Le commentaire doit contenir au moins 10 caractères.");
      return;
    }

    startTransition(async () => {
      const result = await cancelSubscription(
        communeId,
        subscriptionId,
        comment,
      );
      if (!result.success) {
        setError(result.error);
        return;
      }

      handleClose();
      router.refresh();
    });
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Résilier l'abonnement"
      closeDisabled={isPending}
    >
      <div className="space-y-4">
        <div className="rounded-lg border-l-4 border-orange bg-orange/10 p-4">
          <p className="text-sm font-medium text-text">
            La résiliation est effective immédiatement. Cette période restera
            active jusqu&apos;au {formatShortDate(periodEndsAt)} mais le
            renouvellement automatique sera désactivé.
          </p>
          <p className="mt-2 text-xs text-muted">
            Un email de confirmation sera envoyé à tous les administrateurs de
            la commune et à l&apos;équipe Vie Locale.
          </p>
        </div>

        <div>
          <label
            htmlFor="cancellation-comment"
            className="mb-1.5 block text-sm font-medium text-text"
          >
            Motif de résiliation <span className="text-coral">*</span>
          </label>
          <textarea
            id="cancellation-comment"
            rows={4}
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              setError(null);
            }}
            placeholder="Expliquez brièvement la raison de cette résiliation..."
            className="w-full rounded-sm border border-border bg-surface px-4 py-3 text-sm outline-none transition focus:border-purple"
            disabled={isPending}
          />
          <p className="mt-1 text-xs text-muted">Minimum 10 caractères</p>
        </div>

        {error ? (
          <p className="text-sm font-medium text-coral" role="alert">
            {error}
          </p>
        ) : null}

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
            disabled={isPending || comment.trim().length < 10}
            onClick={handleSubmit}
          >
            Confirmer la résiliation
          </Button>
        </div>
      </div>
    </Modal>
  );
}
