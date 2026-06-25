"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  submitSuspensionRevisionRequest,
  type SupportRequestActionState,
} from "@/lib/actions/support-requests";
import { MESSAGE_MAX, MESSAGE_MIN, SUSPENSION_REVISION_SECTION_TITLE, SUSPENSION_REVISION_SECTION_TITLE_SENT } from "@/lib/constants/support-request";
import { Button } from "@/components/ui/button";
import { FormField, Textarea } from "@/components/ui/form-field";

type Props = {
  supportEmail: string;
};

export function SuspendAppealForm({ supportEmail }: Props) {
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const [state, formAction, pending] = useActionState<
    SupportRequestActionState,
    FormData
  >(submitSuspensionRevisionRequest, undefined);

  const canSubmit = message.trim().length >= MESSAGE_MIN;
  const prevPending = useRef(pending);

  useEffect(() => {
    if (prevPending.current && !pending && state?.success) {
      toast.success("Votre demande a bien été envoyée.");
      setMessage("");
      setSubmitted(true);
    }
    prevPending.current = pending;
  }, [pending, state?.success]);

  const sectionTitle = submitted
    ? SUSPENSION_REVISION_SECTION_TITLE_SENT
    : SUSPENSION_REVISION_SECTION_TITLE;

  return (
    <>
      <p className="text-xs font-medium uppercase tracking-wide text-subtle">{sectionTitle}</p>
      {!submitted ? (
        <p className="text-base font-medium leading-6 text-muted">
          Détaillez votre demande. Nous reviendrons vers vous dans les plus brefs délais.
        </p>
      ) : null}
      <form action={formAction} className="flex flex-col gap-3">
      <FormField label="Votre message (10 caractères minimum)">
        <Textarea
          name="message"
          required
          minLength={MESSAGE_MIN}
          maxLength={MESSAGE_MAX}
          rows={5}
          value={message}
          onChange={(event) => setMessage(event.target.value.slice(0, MESSAGE_MAX))}
          placeholder="Bonjour, je voudrais savoir pourquoi j'ai été suspendu …"
        />
      </FormField>

      {state?.error ? (
        <p className="text-sm font-medium text-coral" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" className="w-full py-3" disabled={pending || !canSubmit}>
        {pending ? "Envoi…" : "Envoyer ma demande de révision"}
      </Button>

      <p className="text-xs leading-5 text-muted">
        Vous pouvez aussi nous contacter directement à{" "}
        <a
          href={`mailto:${supportEmail}`}
          className="font-semibold text-purple hover:underline"
        >
          {supportEmail}
        </a>
        . Pensez à préciser votre prénom, votre nom, la commune et votre e-mail de connexion si
        vous nous contactez avec un e-mail différent.
      </p>
    </form>
    </>
  );
}
