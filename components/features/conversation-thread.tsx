"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
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

function getDateKey(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { dateStyle: "short" });
}

function formatDateLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Aujourd'hui";
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return "Hier";
  }
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

type GroupedMessages = { dateKey: string; dateLabel: string; messages: MessageRow[] }[];

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
  const [bodyValue, setBodyValue] = useState("");

  const all = [...messages, ...optimistic];

  const grouped = useMemo<GroupedMessages>(() => {
    const groups: GroupedMessages = [];
    let currentKey = "";
    for (const m of all) {
      const key = getDateKey(m.created_at);
      if (key !== currentKey) {
        currentKey = key;
        groups.push({ dateKey: key, dateLabel: formatDateLabel(m.created_at), messages: [m] });
      } else {
        groups[groups.length - 1].messages.push(m);
      }
    }
    return groups;
  }, [all]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [all.length]);

  async function handleSubmit(formData: FormData) {
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
    formRef.current?.reset();
    setBodyValue("");
    startSending(async () => {
      const result = await sendConversationMessage(formData);
      if (result && "error" in result) {
        setError(result.error);
        setOptimistic((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      } else {
        // Clear optimistic messages before refresh to prevent duplicates
        setOptimistic([]);
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
        className="flex-1 space-y-2 overflow-y-auto px-3 py-3"
        aria-label="Messages"
      >
        {all.length === 0 ? (
          <li className="px-4 py-12 text-center text-sm text-muted">
            Aucun message — dites bonjour !
          </li>
        ) : (
          grouped.map((group) => (
            <li key={group.dateKey}>
              <div className="my-3 flex items-center gap-3">
                <div className="h-px flex-1 bg-border/60" />
                <span className="text-xs font-medium text-muted">{group.dateLabel}</span>
                <div className="h-px flex-1 bg-border/60" />
              </div>
              <ul className="space-y-2">
                {group.messages.map((m) => {
                  const mine = m.sender_id === currentUserId;
                  return (
                    <li
                      key={m.id}
                      className={cn("flex", mine ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "relative max-w-[85%] px-3.5 py-2 text-sm shadow-sm",
                          mine
                            ? "rounded-md rounded-br-none bg-purple text-white"
                            : "rounded-md rounded-bl-none bg-warm text-text",
                        )}
                      >
                        <p className="whitespace-pre-wrap wrap-break-word">{m.body}</p>
                        <p
                          className={cn(
                            "mt-0.5 text-right text-[10px]",
                            mine ? "text-white/70" : "text-muted",
                          )}
                        >
                          {formatTime(m.created_at)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))
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
      ) : readOnly ? (
        <div className="border-t border-border/60 bg-warm/50 p-3">
          <p className="text-center text-sm text-muted">
            Le contenu lié à cette conversation a été suspendu. Vous ne pouvez plus envoyer de messages.
          </p>
        </div>
      ) : (
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
              placeholder="Votre message…"
              maxLength={5000}
              value={bodyValue}
              onChange={(e) => setBodyValue(e.target.value)}
              className="min-h-14 max-h-30 resize-none"
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
              className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-muted underline-offset-2 hover:text-coral hover:underline disabled:cursor-not-allowed"
            >
              <Trash2 className="size-3.5" aria-hidden />
              Supprimer la conversation
            </button>
            <Button type="submit" size="sm" disabled={sending || !bodyValue.trim()}>
              {sending ? "Envoi…" : "Envoyer"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
