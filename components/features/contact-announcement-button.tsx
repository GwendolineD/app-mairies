"use client";

import { useRef, useState, useTransition } from "react";
import { sendContextMessage } from "@/lib/actions/messages";
import { ROUTES } from "@/lib/constants/routes";
import { Button } from "@/components/ui/button";
import { FormField, Textarea } from "@/components/ui/form-field";
import { GradientButton } from "@/components/ui/gradient-button";
import { Modal } from "@/components/ui/modal";
import type { ConversationContextType } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

type Props = {
  /** Id of the announcement / initiative / event to start the conversation about. */
  contextId: string;
  label: string;
  contextType?: ConversationContextType;
  /** Backwards-compatible alias for callers using the old API. */
  announcementId?: string;
  icon?: React.ReactNode;
  className?: string;
};

export function ContactAnnouncementButton({
  contextId,
  announcementId,
  contextType = "announcement",
  label,
  icon,
  className,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentConversationId, setSentConversationId] = useState<string | null>(
    null,
  );
  const [sending, startSending] = useTransition();

  const id = contextId ?? announcementId;

  function handleOpen() {
    setError(null);
    setSentConversationId(null);
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    setError(null);
    setSentConversationId(null);
    formRef.current?.reset();
  }

  function handleSubmit(formData: FormData) {
    if (!id) return;
    setError(null);
    formData.set("contextType", contextType);
    formData.set("contextId", id);

    startSending(async () => {
      const result = await sendContextMessage(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.conversationId) {
        setSentConversationId(result.conversationId);
        formRef.current?.reset();
      }
    });
  }

  const modalTitle = label.startsWith("Contacter ")
    ? `Message à ${label.replace("Contacter ", "")}`
    : label;

  return (
    <>
      <GradientButton
        type="button"
        gradient="hero"
        className={cn("w-full", className)}
        onClick={handleOpen}
      >
        {icon}
        {label}
      </GradientButton>

      <Modal
        open={open}
        onClose={handleClose}
        title={sentConversationId ? "Message envoyé" : modalTitle}
        size="md"
        closeDisabled={sending}
      >
        {sentConversationId ? (
          <div className="space-y-4">
            <p className="text-sm font-medium leading-5 text-muted">
              Votre message a bien été transmis. L&apos;auteur·e pourra vous
              répondre dans la messagerie.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                href={ROUTES.messages.detail(sentConversationId)}
                className="flex-1 py-2 text-sm"
              >
                Voir la conversation
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="py-2 text-sm"
                onClick={handleClose}
              >
                Fermer
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm font-medium leading-5 text-muted">
              Écrivez un message chaleureux pour entrer en contact. Votre
              voisin·e recevra une notification.
            </p>
            <form ref={formRef} action={handleSubmit} className="space-y-3">
              <FormField label="Votre message">
                <Textarea
                  name="body"
                  required
                  rows={4}
                  placeholder="Bonjour, je suis intéressé·e par votre annonce…"
                  maxLength={5000}
                  disabled={sending}
                />
              </FormField>
              {error ? (
                <p className="text-xs text-coral">{error}</p>
              ) : null}
              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="flex-1 py-2 text-sm"
                  disabled={sending}
                >
                  {sending ? "Envoi…" : "Envoyer"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="py-2 text-sm"
                  disabled={sending}
                  onClick={handleClose}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </>
        )}
      </Modal>
    </>
  );
}
