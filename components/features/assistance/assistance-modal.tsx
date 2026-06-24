"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import {
  submitSupportRequest,
  type SupportRequestActionState,
} from "@/lib/actions/support-requests";
import {
  MESSAGE_MAX,
  MESSAGE_MIN,
  SUBJECT_MAX,
  SUBJECT_MIN,
} from "@/lib/constants/support-request";
import { Button } from "@/components/ui/button";
import { FormField, Input, Textarea } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";

type Props = {
  open: boolean;
  onClose: () => void;
  supportEmail: string;
};

export function AssistanceModal({ open, onClose, supportEmail }: Props) {
  const formId = useId();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [state, formAction, pending] = useActionState<
    SupportRequestActionState,
    FormData
  >(submitSupportRequest, undefined);

  const canSubmit =
    subject.trim().length >= SUBJECT_MIN && message.trim().length >= MESSAGE_MIN;

  const prevPending = useRef(pending);

  useEffect(() => {
    if (prevPending.current && !pending && state?.success) {
      toast.success("Merci, c'est bien reçu. Nous revenons vers vous par e-mail si besoin.");
      setSubject("");
      setMessage("");
      onClose();
    }
    prevPending.current = pending;
  }, [pending, state?.success, onClose]);

  function handleClose() {
    if (pending) return;
    setSubject("");
    setMessage("");
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      closeDisabled={pending}
      title="Besoin d'aide ?"
      size="md"
      description="Signalez un bug, une idée ou une question. Décrivez le plus précisément possible ce que vous faisiez au moment du problème."
      footer={
        <div className="flex flex-col-reverse gap-4 sm:flex-row sm:justify-end sm:gap-3">
          <Button
            type="button"
            variant="ghost"
            size="default"
            className="h-11 w-full sm:h-auto sm:w-auto"
            disabled={pending}
            onClick={handleClose}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            form={formId}
            variant="primary"
            size="default"
            className="h-11 w-full sm:h-auto sm:w-auto"
            disabled={pending || !canSubmit}
          >
            {pending ? "Envoi…" : "Envoyer"}
          </Button>
        </div>
      }
    >
      <form id={formId} action={formAction} className="space-y-4">
        <FormField label="Objet">
          <div className="relative">
            <Input
              name="subject"
              required
              maxLength={SUBJECT_MAX}
              value={subject}
              onChange={(event) => setSubject(event.target.value.slice(0, SUBJECT_MAX))}
              placeholder="Ex. Je ne reçois pas mes messages"
              className="pr-14"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-subtle">
              {subject.length}/{SUBJECT_MAX}
            </span>
          </div>
        </FormField>

        <FormField label="Message">
          <div className="relative">
            <Textarea
              name="message"
              required
              rows={5}
              maxLength={MESSAGE_MAX}
              value={message}
              onChange={(event) => setMessage(event.target.value.slice(0, MESSAGE_MAX))}
              placeholder="Que s'est-il passé ? Sur quel écran ?"
              className="max-h-96 resize-none pb-8 field-sizing-fixed"
            />
            <span className="pointer-events-none absolute right-3 bottom-2 text-xs font-medium text-subtle">
              {message.length}/{MESSAGE_MAX}
            </span>
          </div>
        </FormField>

        {state?.error ? (
          <p className="text-sm font-medium text-coral" role="alert">
            {state.error}
          </p>
        ) : null}

        <div className="space-y-2 text-sm text-muted">
          <p>N&apos;indiquez pas votre mot de passe.</p>
          <p>
            Vous préférez écrire directement ?{" "}
            <a
              href={`mailto:${supportEmail}`}
              className="font-semibold text-purple hover:underline"
            >
              {supportEmail}
            </a>{" "}
            — indiquez votre <strong className="font-semibold text-text">prénom</strong>,{" "}
            <strong className="font-semibold text-text">nom</strong> et{" "}
            <strong className="font-semibold text-text">commune</strong>. Si vous envoyez depuis
            une adresse différente de celle de votre compte, précisez aussi votre{" "}
            <strong className="font-semibold text-text">e-mail de connexion</strong>.
          </p>
        </div>
      </form>
    </Modal>
  );
}
