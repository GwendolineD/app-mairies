"use client";

import { useState, useTransition } from "react";
import {
  markSupportRequestInProgress,
  updateSupportRequestStatus,
} from "@/lib/actions/support-requests";
import type { SupportRequestStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form-field";

type Props = {
  requestId: string;
  status: SupportRequestStatus;
  initialComment?: string | null;
};

export function BackofficeSupportActions({
  requestId,
  status,
  initialComment = "",
}: Props) {
  const [comment, setComment] = useState(initialComment ?? "");
  const [busy, run] = useTransition();

  const isOpen = status === "new" || status === "in_progress";

  if (!isOpen) {
    return initialComment ? (
      <p className="text-sm text-muted">
        <span className="font-medium text-text">Commentaire :</span> {initialComment}
      </p>
    ) : null;
  }

  function handleInProgress() {
    run(async () => {
      await markSupportRequestInProgress(requestId);
    });
  }

  function handleResolve() {
    run(async () => {
      await updateSupportRequestStatus(requestId, "resolved", comment);
    });
  }

  function handleDismiss() {
    run(async () => {
      await updateSupportRequestStatus(requestId, "dismissed", comment);
    });
  }

  return (
    <div className="space-y-3 pt-1">
      <Textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        rows={3}
        placeholder="Commentaire interne (optionnel pour ignorer, recommandé pour résolu)…"
        className="resize-none field-sizing-fixed"
      />
      <div className="flex flex-wrap gap-2">
        {status === "new" ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={handleInProgress}
          >
            Marquer en cours
          </Button>
        ) : null}
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={busy}
          onClick={handleResolve}
        >
          Résolu
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={handleDismiss}
        >
          Ignorer
        </Button>
      </div>
    </div>
  );
}
