"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import {
  markConversationRead,
  sendDirectMessage,
} from "@/lib/actions/messages";
import { Avatar } from "@/components/ui/avatar";
import { BackLink } from "@/components/ui/back-link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants/routes";
import { CONTEXT_LABEL, contextHref } from "@/lib/utils/conversation";
import {
  formatMessageDaySeparator,
  formatMessageTime,
} from "@/lib/utils/date";
import { participantName } from "@/lib/utils/names";
import { cn } from "@/lib/utils/cn";
import { useMessaging } from "./messaging-context";
import type {
  ContextType,
  ParticipantProfile,
  ThreadMessage,
} from "@/lib/types";

type Props = {
  conversationId: string;
  currentUserId: string;
  otherParticipant: ParticipantProfile | null;
  contextType: ContextType | null;
  contextId: string | null;
  contextTitle: string | null;
  initialMessages: ThreadMessage[];
};

/** Merge server + live + optimistic messages into a single ordered, deduped list. */
function mergeMessages(
  base: ThreadMessage[],
  live: ThreadMessage[],
): ThreadMessage[] {
  const byId = new Map<string, ThreadMessage>();
  for (const message of base) byId.set(message.id, message);
  for (const message of live) {
    if (!byId.has(message.id)) byId.set(message.id, message);
  }

  // Drop optimistic twins once their real row (from realtime or refresh) lands.
  const real = [...byId.values()].filter((m) => !m.id.startsWith("temp-"));
  const realKey = new Set(real.map((m) => `${m.sender_id}:${m.body}`));
  const merged = [...byId.values()].filter(
    (m) => !(m.id.startsWith("temp-") && realKey.has(`${m.sender_id}:${m.body}`)),
  );

  return merged.sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export function MessageThreadClient({
  conversationId,
  currentUserId,
  otherParticipant,
  contextType,
  contextId,
  contextTitle,
  initialMessages,
}: Props) {
  const messaging = useMessaging();
  // Server messages flow in as props; realtime + optimistic ones live here.
  const [liveMessages, setLiveMessages] = useState<ThreadMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const name = participantName(otherParticipant);
  const ctxHref = contextHref(contextType, contextId);

  const messages = useMemo(
    () => mergeMessages(initialMessages, liveMessages),
    [initialMessages, liveMessages],
  );

  const markRead = useCallback(() => {
    markConversationRead(conversationId).then(() => messaging?.refreshUnread());
  }, [conversationId, messaging]);

  const setActiveConversationId = messaging?.setActiveConversationId;

  // Flag the active thread (suppresses its own toast) + mark read on open.
  useEffect(() => {
    setActiveConversationId?.(conversationId);
    markRead();
    return () => setActiveConversationId?.(null);
  }, [conversationId, markRead, setActiveConversationId]);

  // Live message stream for this conversation.
  useEffect(() => {
    const supabase = createClient();
    let active = true;

    const setup = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) supabase.realtime.setAuth(session.access_token);

      const channel = supabase
        .channel(`thread:${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            if (!active) return;
            const row = payload.new as ThreadMessage;
            const enriched: ThreadMessage = {
              ...row,
              sender:
                row.sender_id === currentUserId ? null : otherParticipant,
            };
            setLiveMessages((prev) =>
              prev.some((m) => m.id === enriched.id)
                ? prev
                : [...prev, enriched],
            );
            if (row.sender_id !== currentUserId) markRead();
          },
        )
        .subscribe();

      return channel;
    };

    const channelPromise = setup();
    return () => {
      active = false;
      channelPromise.then((channel) => {
        if (channel) supabase.removeChannel(channel);
      });
    };
  }, [conversationId, currentUserId, otherParticipant, markRead]);

  // Keep the latest message in view.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const handleSend = useCallback(async () => {
    const body = draft.trim();
    if (!body || sending) return;

    const tempId = `temp-${Date.now()}`;
    const optimistic: ThreadMessage = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      body,
      created_at: new Date().toISOString(),
      edited_at: null,
      sender: null,
    };
    setLiveMessages((prev) => [...prev, optimistic]);
    setDraft("");
    setError(null);
    setSending(true);

    const result = await sendDirectMessage(conversationId, body);
    setSending(false);

    if (!result.ok) {
      setLiveMessages((prev) => prev.filter((m) => m.id !== tempId));
      setDraft(body);
      setError(result.error);
      return;
    }

    setLiveMessages((prev) =>
      prev.map((m) => (m.id === tempId ? { ...m, id: result.messageId } : m)),
    );
  }, [draft, sending, conversationId, currentUserId]);

  const grouped = useMemo(() => groupByDay(messages), [messages]);

  return (
    <div className="flex h-[calc(100dvh-13rem)] min-h-[28rem] flex-col gap-3 md:h-[calc(100dvh-12rem)]">
      <div className="flex items-center justify-between gap-2">
        <BackLink href={ROUTES.messages.list}>← Conversations</BackLink>
      </div>

      <Card className="flex items-center gap-3 p-4">
        <Avatar profile={otherParticipant} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-text">{name}</p>
          {contextType ? (
            ctxHref ? (
              <a
                href={ctxHref}
                className="truncate text-xs font-medium text-purple underline"
              >
                {CONTEXT_LABEL[contextType]}
                {contextTitle ? ` · ${contextTitle}` : ""}
              </a>
            ) : (
              <p className="truncate text-xs font-medium text-subtle">
                {CONTEXT_LABEL[contextType]}
                {contextTitle ? ` · ${contextTitle}` : ""}
              </p>
            )
          ) : null}
        </div>
      </Card>

      <Card className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <p className="text-sm font-medium leading-5 text-muted">
              Dites bonjour à {name} — votre premier message lancera la
              conversation.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {grouped.map((group) => (
              <div key={group.key} className="flex flex-col gap-2">
                <div className="flex justify-center">
                  <span className="rounded-full bg-warm px-3 py-1 text-[11px] font-semibold text-subtle">
                    {group.label}
                  </span>
                </div>
                {group.items.map((message) => {
                  const mine = message.sender_id === currentUserId;
                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex flex-col",
                        mine ? "items-end" : "items-start",
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-2 text-sm font-medium leading-5",
                          mine
                            ? "rounded-br-sm text-white gradient-hero"
                            : "rounded-bl-sm bg-warm text-text",
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {message.body}
                        </p>
                      </div>
                      <span className="mt-1 px-1 text-[11px] font-medium text-subtle">
                        {formatMessageTime(message.created_at)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </Card>

      <Card className="p-3">
        {error ? (
          <p className="mb-2 text-xs font-medium text-coral">{error}</p>
        ) : null}
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSend();
              }
            }}
            rows={1}
            placeholder={`Écrire à ${name}…`}
            className="max-h-32 min-h-11 flex-1 resize-none rounded-sm border border-border bg-surface px-3 py-2.5 text-sm font-medium text-text outline-none focus:border-purple"
          />
          <Button
            type="button"
            onClick={() => void handleSend()}
            disabled={sending || draft.trim().length === 0}
            className="shrink-0"
          >
            Envoyer
          </Button>
        </div>
      </Card>
    </div>
  );
}

type DayGroup = {
  key: string;
  label: string;
  items: ThreadMessage[];
};

function groupByDay(messages: ThreadMessage[]): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const message of messages) {
    const key = new Date(message.created_at).toDateString();
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.items.push(message);
    } else {
      groups.push({
        key,
        label: formatMessageDaySeparator(message.created_at),
        items: [message],
      });
    }
  }
  return groups;
}
