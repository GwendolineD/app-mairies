"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ROUTES } from "@/lib/constants/routes";
import { MessagingContext } from "./messaging-context";

type Toast = {
  id: string;
  title: string;
  body: string;
  conversationId: string;
};

type Props = {
  children: React.ReactNode;
  currentUserId: string;
  communeId: string;
  initialUnread: number;
};

/**
 * App-wide messaging glue: keeps the unread badge in sync, listens for new
 * message notifications over realtime and surfaces an in-app toast when the
 * recipient is not already viewing the relevant thread.
 */
export function MessagingProvider({
  children,
  currentUserId,
  communeId,
  initialUnread,
}: Props) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(initialUnread);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const activeRef = useRef<string | null>(null);
  useEffect(() => {
    activeRef.current = activeConversationId;
  }, [activeConversationId]);

  const refreshUnread = useCallback(() => {
    const supabase = createClient();
    supabase
      .rpc("get_unread_message_count", { p_commune_id: communeId })
      .then(({ data }) => {
        if (typeof data === "number") setUnreadCount(data);
      });
  }, [communeId]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    const setup = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        supabase.realtime.setAuth(session.access_token);
      }

      const channel = supabase
        .channel(`notifications:${currentUserId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${currentUserId}`,
          },
          (payload) => {
            if (!active) return;
            const row = payload.new as {
              title: string | null;
              body: string | null;
              payload: { type?: string; conversation_id?: string };
            };
            if (row.payload?.type !== "message") return;

            refreshUnread();

            const conversationId = row.payload.conversation_id;
            if (!conversationId || conversationId === activeRef.current) return;

            const toast: Toast = {
              id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
              title: row.title ?? "Nouveau message",
              body: row.body ?? "",
              conversationId,
            };
            setToasts((prev) => [...prev.slice(-2), toast]);
            window.setTimeout(() => {
              if (active) dismissToast(toast.id);
            }, 6000);
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
  }, [currentUserId, refreshUnread, dismissToast]);

  return (
    <MessagingContext.Provider
      value={{
        unreadCount,
        refreshUnread,
        activeConversationId,
        setActiveConversationId,
      }}
    >
      {children}
      {toasts.length > 0 ? (
        <div className="fixed inset-x-0 top-3 z-50 flex flex-col items-center gap-2 px-4 md:left-auto md:right-4 md:items-end">
          {toasts.map((toast) => (
            <button
              key={toast.id}
              type="button"
              onClick={() => {
                dismissToast(toast.id);
                router.push(ROUTES.messageThread(toast.conversationId));
              }}
              className="w-full max-w-sm cursor-pointer rounded-2xl border border-border/60 bg-surface p-4 text-left shadow-elevated transition hover:bg-warm/60"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-purple">
                Nouveau message
              </p>
              <p className="mt-0.5 truncate text-sm font-semibold text-text">
                {toast.title}
              </p>
              <p className="truncate text-sm font-medium text-muted">
                {toast.body}
              </p>
            </button>
          ))}
        </div>
      ) : null}
    </MessagingContext.Provider>
  );
}
