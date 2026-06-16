"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  archiveConversation,
  restoreConversation,
  sendConversationMessage,
} from "@/lib/actions/messages";
import { Button } from "@/components/ui/button";
import { FormField, Textarea } from "@/components/ui/form-field";
import { ROUTES } from "@/lib/constants/routes";
import type { MessageRow } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { RelativeTime } from "@/components/ui/relative-time";

type Props = {
  conversationId: string;
  messages: MessageRow[];
  currentUserId: string;
  isArchived?: boolean;
  /** If true, the current viewer wrote the original announcement / initiative / event. */
  readOnly?: boolean;
};

export function ConversationThread({
  conversationId,
  messages,
  currentUserId,
  isArchived,
  readOnly,
}: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [optimistic, setOptimistic] = useState<MessageRow[]>([]);
  const [sending, startSending] = useTransition();
  const [archiving, startArchiving] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const all = [...messages, ...optimistic];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [all.length]);

  // Clear optimistic items when the canonical server list catches up.
  useEffect(() => {
    if (optimistic.length === 0) return;
    const known = new Set(messages.map((m) => m.body + m.created_at.slice(0, 16)));
    setOptimistic((prev) =>
      prev.filter((m) => !known.has(m.body + m.created_at.slice(0, 16))),
    );
  }, [messages, optimistic.length]);

  async function handleSubmit(formData: FormData) {
<<<<<<< HEAD
    const body = formData.get("body") as string;
    if (!body?.trim()) return;
    await sendConversationMessage(conversationId, body);
=======
    setError(null);
    const body = (formData.get("body") as string | null)?.trim();
    if (!body) return;
    const optimisticMsg: MessageRow = {
      id: `optimistic-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: currentUserId,
      body,
      created_at: new Date().toISOString(),
      edited_at: null,
    };
    setOptimistic((prev) => [...prev, optimisticMsg]);
>>>>>>> preprod
    formRef.current?.reset();
    startSending(async () => {
      const result = await sendConversationMessage(formData);
      if (result && "error" in result) {
        setError(result.error);
        setOptimistic((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      } else {
        router.refresh();
      }
    });
  }

  function handleArchive() {
    startArchiving(async () => {
      const result = await archiveConversation(conversationId);
      if (!result?.error) router.push(ROUTES.messages.list);
    });
  }

  function handleRestore() {
    startArchiving(async () => {
      await restoreConversation(conversationId);
      router.refresh();
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ul
        className="flex-1 space-y-3 overflow-y-auto px-1 py-2"
        aria-label="Messages"
      >
        {all.length === 0 ? (
          <li className="px-4 py-12 text-center text-sm text-muted">
            Aucun message — dites bonjour !
          </li>
        ) : (
          all.map((m) => {
            const mine = m.sender_id === currentUserId;
            return (
              <li
                key={m.id}
                className={cn("flex", mine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                    mine ? "bg-purple text-white" : "bg-warm text-text",
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p
                    className={cn(
                      "mt-1 text-[10px]",
                      mine ? "text-white/70" : "text-muted",
                    )}
                  >
                    <RelativeTime iso={m.created_at} />
                  </p>
                </div>
              </li>
            );
          })
        )}
        <div ref={bottomRef} />
      </ul>

      {isArchived ? (
        <div className="border-t border-border/60 bg-warm/50 p-3">
          <div className="flex items-center justify-between gap-3 text-sm">
            <p className="text-muted">
              Conversation supprimée — sera purgée après 30 jours.
            </p>
            <Button
              type="button"
              variant="secondary"
              onClick={handleRestore}
              disabled={archiving}
            >
              Restaurer
            </Button>
          </div>
        </div>
      ) : readOnly ? null : (
        <form
          ref={formRef}
          action={handleSubmit}
          className="border-t border-border/60 p-3"
        >
          <input type="hidden" name="conversationId" value={conversationId} />
          <FormField label="Votre message">
            <Textarea
              name="body"
              rows={2}
              required
              placeholder="Écrivez ici…"
              maxLength={5000}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  formRef.current?.requestSubmit();
                }
              }}
            />
          </FormField>
          {error ? (
            <p className="mt-1 text-xs text-coral">{error}</p>
          ) : null}
          <div className="mt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleArchive}
              disabled={archiving || sending}
              className="cursor-pointer text-xs font-semibold text-muted underline-offset-2 hover:text-coral hover:underline disabled:cursor-not-allowed"
            >
              Supprimer la conversation
            </button>
            <Button type="submit" disabled={sending}>
              {sending ? "Envoi…" : "Envoyer"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
