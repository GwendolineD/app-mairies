// @ts-nocheck
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { MembershipActionResult } from "@/lib/actions/municipality";
import type { MembershipStatus } from "@/lib/types";

type ActionFn = (formData: FormData) => Promise<MembershipActionResult>;

type Props = {
  membershipId: string;
  status: MembershipStatus;
  suspendAction: ActionFn;
  reactivateAction: ActionFn;
};

export function HabitantActions({
  membershipId,
  status,
  suspendAction,
  reactivateAction,
}: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSuspend(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await suspendAction(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        setOpen(false);
      }
    });
  }

  function handleReactivate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await reactivateAction(formData);
      if (res?.error) setError(res.error);
    });
  }

  if (status === "suspended") {
    return (
      <form action={handleReactivate} className="flex flex-col items-end gap-1">
        <input type="hidden" name="membershipId" value={membershipId} />
        <Button
          type="submit"
          variant="secondary"
          disabled={isPending}
          className="px-4 py-2 text-xs"
        >
          {isPending ? "…" : "Réactiver"}
        </Button>
        {error ? <span className="text-[10px] text-coral">{error}</span> : null}
      </form>
    );
  }

  if (status === "left") {
    return <span className="text-xs font-medium text-subtle">Parti·e</span>;
  }

  return (
    <>
      <Button
        type="button"
        variant="danger"
        onClick={() => setOpen(true)}
        className="px-4 py-2 text-xs"
      >
        Suspendre
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Suspendre cet·te habitant·e"
      >
        <form action={handleSuspend} className="space-y-4">
          <input type="hidden" name="membershipId" value={membershipId} />
          <p className="text-sm font-medium text-muted">
            La personne perdra l&apos;accès à la commune jusqu&apos;à
            réactivation. Vous pouvez préciser un motif (visible en interne).
          </p>
          <textarea
            name="reason"
            rows={3}
            maxLength={500}
            placeholder="Motif de la suspension (optionnel)"
            className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-text focus:border-purple focus:outline-none"
          />
          {error ? <p className="text-xs text-coral">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
              className="text-xs"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="danger"
              disabled={isPending}
              className="text-xs"
            >
              {isPending ? "Suspension…" : "Confirmer la suspension"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
