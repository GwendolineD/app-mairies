"use client";

import { useState, useTransition } from "react";
import { Loader2, RotateCw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  resendInvitationAsAdmin,
  deleteInvitationAsAdmin,
} from "@/lib/actions/staff-invitation";

type Props = {
  inviteId: string;
  isPending: boolean;
};

export function InvitationActions({ inviteId, isPending: parentPending }: Props) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const busy = isPending || parentPending;

  const handleResend = () => {
    startTransition(async () => {
      setFeedback(null);
      const res = await resendInvitationAsAdmin(inviteId);
      if (res.success) {
        setFeedback("Renvoyée");
        router.refresh();
      } else {
        setFeedback(res.error);
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      setFeedback(null);
      const res = await deleteInvitationAsAdmin(inviteId);
      if (res.success) {
        setDeleteOpen(false);
        router.refresh();
      } else {
        setFeedback(res.error);
      }
    });
  };

  return (
    <>
      <div className="flex items-center gap-1.5">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleResend}
          disabled={busy}
          title="Renvoyer l'invitation"
        >
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <RotateCw className="size-3.5" aria-hidden />
          )}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setDeleteOpen(true)}
          disabled={busy}
          title="Supprimer l'invitation"
          className="text-coral hover:text-coral"
        >
          <Trash2 className="size-3.5" aria-hidden />
        </Button>
        {feedback ? (
          <span className="text-xs text-purple">{feedback}</span>
        ) : null}
      </div>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Supprimer l'invitation"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text">
            Cette invitation sera définitivement supprimée.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteOpen(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
