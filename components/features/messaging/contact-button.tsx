"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ensureContextConversation,
  sendConversationMessage,
} from "@/lib/actions/messages";
import { ROUTES } from "@/lib/constants/routes";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/ui/gradient-button";
import { Modal } from "@/components/ui/modal";
import type { ContextType } from "@/lib/types";

type Props = {
  contextType: ContextType;
  contextId: string;
  contextTitle?: string;
  gradient?: "demande" | "offre" | "initiative" | "events" | "hero";
  label?: string;
};

/**
 * Opens a compose modal, creates (or reuses) the 1:1 thread tied to this
 * content item, sends the first message, then navigates to the conversation.
 */
export function ContactButton({
  contextType,
  contextId,
  contextTitle,
  gradient = "hero",
  label = "Envoyer un message",
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const openModal = useCallback(() => {
    setError(null);
    setOpen(true);
    // Focus the textarea once the modal has mounted.
    window.setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  const closeModal = useCallback(() => {
    if (sending) return;
    setOpen(false);
  }, [sending]);

  const handleSend = useCallback(async () => {
    const message = body.trim();
    if (!message || sending) return;

    setSending(true);
    setError(null);

    const ensured = await ensureContextConversation(contextType, contextId);
    if (!ensured.ok) {
      setSending(false);
      setError(ensured.error);
      return;
    }

    const sent = await sendConversationMessage(ensured.conversationId, message);
    if (!sent.ok) {
      setSending(false);
      setError(sent.error);
      return;
    }

    router.push(ROUTES.messageThread(ensured.conversationId));
  }, [body, sending, contextType, contextId, router]);

  return (
    <>
      <GradientButton type="button" gradient={gradient} onClick={openModal}>
        {label}
      </GradientButton>

      <Modal open={open} onClose={closeModal} title="Envoyer un message">
        <div className="space-y-4">
          {contextTitle ? (
            <p className="rounded-md bg-warm px-3 py-2 text-xs font-medium leading-4 text-muted">
              À propos de «&nbsp;{contextTitle}&nbsp;»
            </p>
          ) : null}

          <textarea
            ref={textareaRef}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            onKeyDown={(event) => {
              if (
                (event.key === "Enter" && (event.metaKey || event.ctrlKey)) &&
                !sending
              ) {
                event.preventDefault();
                void handleSend();
              }
            }}
            rows={4}
            maxLength={5000}
            placeholder="Présentez-vous et expliquez votre demande…"
            disabled={sending}
            className="w-full resize-none rounded-sm border border-border bg-surface px-3 py-2.5 text-sm font-medium text-text outline-none focus:border-purple disabled:opacity-50"
          />

          {error ? (
            <p className="text-xs font-medium text-coral">{error}</p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={closeModal}
              disabled={sending}
            >
              Annuler
            </Button>
            <GradientButton
              type="button"
              gradient={gradient}
              onClick={() => void handleSend()}
              disabled={sending || body.trim().length === 0}
            >
              {sending ? "Envoi…" : "Envoyer"}
            </GradientButton>
          </div>
        </div>
      </Modal>
    </>
  );
}
