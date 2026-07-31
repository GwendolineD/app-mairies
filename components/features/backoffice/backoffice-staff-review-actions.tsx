"use client";

import { useState, useTransition } from "react";
import type { StaffReviewStatus } from "@/lib/constants/staff-review-status";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form-field";

type Props = {
  status: StaffReviewStatus;
  initialComment?: string | null;
  resolveButtonLabel?: string;
  onMarkNew: (comment: string) => Promise<{ success: boolean; error?: string }>;
  onInProgress: (comment: string) => Promise<{ success: boolean; error?: string }>;
  onResolve: (comment: string) => Promise<{ success: boolean; error?: string }>;
  onDismiss: (comment: string) => Promise<{ success: boolean; error?: string }>;
};

export function BackofficeStaffReviewActions({
  status,
  initialComment = "",
  resolveButtonLabel = "Résolu",
  onMarkNew,
  onInProgress,
  onResolve,
  onDismiss,
}: Props) {
  const [comment, setComment] = useState(initialComment ?? "");
  const [busy, run] = useTransition();

  function runAction(action: (comment: string) => Promise<{ success: boolean; error?: string }>) {
    run(async () => {
      await action(comment);
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
        {status !== "new" ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => runAction(onMarkNew)}
          >
            Remettre non lu
          </Button>
        ) : null}
        {status !== "in_progress" ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => runAction(onInProgress)}
          >
            Marquer en cours
          </Button>
        ) : null}
        {status !== "resolved" ? (
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={busy}
            onClick={() => runAction(onResolve)}
          >
            {resolveButtonLabel}
          </Button>
        ) : null}
        {status !== "dismissed" ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => runAction(onDismiss)}
          >
            Ignorer
          </Button>
        ) : null}
      </div>
    </div>
  );
}
