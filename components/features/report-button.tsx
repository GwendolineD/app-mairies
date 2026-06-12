"use client";

import { useState } from "react";
import { submitContentReport } from "@/lib/actions/reports";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";

type Props = {
  contextType: "announcement" | "initiative" | "event";
  contextId: string;
};

export function ReportButton({ contextType, contextId }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        className="text-xs uppercase tracking-wide"
        onClick={() => setOpen(true)}
      >
        Signaler
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Signalement bienveillant" size="md">
        <p className="mb-3 text-sm font-medium leading-5 text-muted">
          Expliquez le problème de manière constructive. Une modératrice examine
          chaque dossier lorsque la commune le permet.
        </p>
        <form action={submitContentReport} className="space-y-3">
          <input type="hidden" name="contextType" value={contextType} />
          <input type="hidden" name="contextId" value={contextId} />
          <Textarea
            name="reason"
            required
            minLength={10}
            rows={4}
            placeholder="Détaillez précisément le motif (minimum 10 caractères)."
          />
          <div className="flex gap-2">
            <Button type="submit" className="flex-1 py-2 text-sm">
              Envoyer
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="py-2 text-sm"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
