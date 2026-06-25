"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  submitContentReport,
  type ContentReportActionState,
} from "@/lib/actions/reports";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils/cn";

const REASON_MIN = 10;
const REASON_MAX = 400;

type Props = {
  contextType: "announcement" | "initiative" | "event";
  contextId: string;
  className?: string;
  showIcon?: boolean;
};

export function ReportButton({
  contextType,
  contextId,
  className,
  showIcon = false,
}: Props) {
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [state, formAction, pending] = useActionState<
    ContentReportActionState,
    FormData
  >(submitContentReport, undefined);

  const canSubmit =
    reason.trim().length >= REASON_MIN && reason.length <= REASON_MAX;

  const prevPending = useRef(pending);

  useEffect(() => {
    if (prevPending.current && !pending && state?.success) {
      toast.success("Votre signalement a bien été envoyé.");
      setReason("");
      setOpen(false);
    }
    prevPending.current = pending;
  }, [pending, state?.success]);

  function handleClose() {
    if (pending) return;
    setOpen(false);
    setReason("");
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        className={cn(
          "gap-2 text-xs uppercase tracking-wide",
          showIcon && "normal-case tracking-normal",
          className,
        )}
        onClick={() => setOpen(true)}
      >
        {showIcon ? <Flag className="size-4 shrink-0" aria-hidden /> : null}
        Signaler
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        closeDisabled={pending}
        title="Signalement"
        description="Votre signalement sera étudié avec soin."
        size="md"
        footer={
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="py-2 text-sm"
              disabled={pending}
              onClick={handleClose}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              form={formId}
              size="sm"
              className="flex-1 gap-1.5 py-2 text-sm"
              disabled={pending || !canSubmit}
            >
              {pending ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : null}
              {pending ? "Envoi…" : "Envoyer"}
            </Button>
          </div>
        }
      >
        <form id={formId} action={formAction} className="space-y-3">
          <input type="hidden" name="contextType" value={contextType} />
          <input type="hidden" name="contextId" value={contextId} />
          <div className="relative">
            <Textarea
              name="reason"
              required
              minLength={REASON_MIN}
              maxLength={REASON_MAX}
              rows={4}
              value={reason}
              disabled={pending}
              onChange={(event) => setReason(event.target.value.slice(0, REASON_MAX))}
              placeholder="Détaillez précisément le motif (minimum 10 caractères)."
              className="resize-none pb-8 field-sizing-fixed"
              onFocus={(event) => {
                const field = event.currentTarget;
                requestAnimationFrame(() => {
                  field?.scrollIntoView({
                    block: "center",
                    behavior: "smooth",
                  });
                });
              }}
            />
            <span className="pointer-events-none absolute right-3 bottom-2 text-xs font-medium text-subtle">
              {reason.length}/{REASON_MAX}
            </span>
          </div>
          {state?.error ? (
            <p className="text-sm font-medium text-coral" role="alert">
              {state.error}
            </p>
          ) : null}
        </form>
      </Modal>
    </>
  );
}
