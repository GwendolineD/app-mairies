"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FormField, Textarea } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type Props = {
  /** Server action invoked with the assembled FormData on confirmation. */
  action: (formData: FormData) => void | Promise<void>;
  fields?: Record<string, string>;
  label: string;
  title: string;
  description?: string;
  confirmLabel?: string;
  variant?: Variant;
  confirmVariant?: Variant;
  withReason?: boolean;
  reasonLabel?: string;
  className?: string;
};

export function ConfirmButton({
  action,
  fields = {},
  label,
  title,
  description,
  confirmLabel = "Confirmer",
  variant = "secondary",
  confirmVariant = "danger",
  withReason = false,
  reasonLabel = "Motif (optionnel)",
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  function confirm() {
    const formData = new FormData();
    for (const [key, value] of Object.entries(fields)) {
      formData.append(key, value);
    }
    if (withReason && reason.trim()) {
      formData.append("reason", reason.trim());
    }
    startTransition(async () => {
      await action(formData);
      setOpen(false);
      setReason("");
    });
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        className={className ?? "px-3 py-1.5 text-xs"}
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={title}>
        <div className="space-y-4">
          {description ? (
            <p className="text-sm font-medium leading-5 text-muted">
              {description}
            </p>
          ) : null}
          {withReason ? (
            <FormField label={reasonLabel}>
              <Textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Précisez le motif…"
              />
            </FormField>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              className="px-4 py-2 text-sm"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant={confirmVariant}
              className="px-4 py-2 text-sm"
              onClick={confirm}
              disabled={pending}
            >
              {pending ? "…" : confirmLabel}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
