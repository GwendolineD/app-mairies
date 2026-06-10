"use client";

import { useRef } from "react";
import { sendConversationMessage } from "@/lib/actions/messages";
import { Button } from "@/components/ui/button";
import { FormField, Textarea } from "@/components/ui/form-field";
import type { MessageRow } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { formatRelativeTime } from "@/lib/utils/date";

type Props = {
  conversationId: string;
  messages: MessageRow[];
  currentUserId: string;
};

export function ConversationThread({
  conversationId,
  messages,
  currentUserId,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    const body = formData.get("body") as string;
    if (!body?.trim()) return;
    await sendConversationMessage(conversationId, body);
    formRef.current?.reset();
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="max-h-[50vh] space-y-3 overflow-y-auto">
        {messages.length === 0 ? (
          <li className="text-sm text-muted">Aucun message — dites bonjour !</li>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === currentUserId;
            return (
              <li
                key={m.id}
                className={cn("flex", mine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2 text-sm",
                    mine ? "bg-purple text-white" : "bg-warm text-text",
                  )}
                >
                  <p className="whitespace-pre-wrap">{m.body}</p>
                  <p
                    className={cn(
                      "mt-1 text-[10px]",
                      mine ? "text-white/70" : "text-muted",
                    )}
                  >
                    {formatRelativeTime(m.created_at)}
                  </p>
                </div>
              </li>
            );
          })
        )}
      </ul>

      <form ref={formRef} action={handleSubmit} className="space-y-2">
        <input type="hidden" name="conversationId" value={conversationId} />
        <FormField label="Votre message">
          <Textarea name="body" rows={3} required placeholder="Écrivez ici…" />
        </FormField>
        <Button type="submit" className="w-full">
          Envoyer
        </Button>
      </form>
    </div>
  );
}
