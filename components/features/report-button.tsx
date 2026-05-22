"use client";

import { useState } from "react";
import { submitContentReport } from "@/lib/actions/reports";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Props = {
  contextType: "announcement" | "initiative" | "event";
  contextId: string;
};

export function ReportButton({ contextType, contextId }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        className="rounded-full text-xs uppercase tracking-wide"
        onClick={() => setOpen((v) => !v)}
      >
        Signaler
      </Button>
      {open ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-text/35 p-4 sm:items-center">
          <Card className="w-full max-w-md space-y-3 p-6">
            <div>
              <h2 className="text-lg font-bold text-text">
                Signalement bienveillant
              </h2>
              <p className="text-xs leading-relaxed text-muted">
                Expliquez le problème de manière constructive. Une modératrice examine
                chaque dossier lorsque la commune le permet.
              </p>
            </div>
            <form action={submitContentReport} className="space-y-3">
              <input type="hidden" name="contextType" value={contextType} />
              <input type="hidden" name="contextId" value={contextId} />
              <textarea
                name="reason"
                required
                minLength={10}
                rows={4}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-purple"
                placeholder="Détaillez précisément le motif (minimum 10 caractères)."
              />
              <div className="flex gap-2">
                <Button type="submit" className="flex-1 rounded-full py-2 text-sm">
                  Envoyer
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-full py-2 text-sm"
                  onClick={() => setOpen(false)}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
