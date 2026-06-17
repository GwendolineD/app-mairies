"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Archive, ArchiveRestore, Megaphone, Sparkles, CalendarDays, MessageCircle, Inbox, Trash2 } from "lucide-react";
import {
  archiveConversation,
  restoreConversation,
} from "@/lib/actions/messages";
import { ROUTES } from "@/lib/constants/routes";
import type {
  ConversationContextType,
  ConversationInboxItem,
} from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { RelativeTime } from "@/components/ui/relative-time";

const CONTEXT_ICON: Record<ConversationContextType, typeof MessageCircle> = {
  announcement: Megaphone,
  initiative: Sparkles,
  event: CalendarDays,
};

const CONTEXT_LABEL: Record<ConversationContextType, string> = {
  announcement: "Annonce",
  initiative: "Initiative",
  event: "Événement",
};

type Props = {
  conversations: ConversationInboxItem[];
  view: "active" | "archived";
  selectedId?: string;
  currentUserId: string;
};

export function MessagesInboxList({
  conversations,
  view,
  selectedId,
  currentUserId,
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  // Tab links always return to the inbox root. Switching tabs from inside a thread
  // leaves the thread (the right pane no longer relates to the tab being switched to).
  const activeTabHref = ROUTES.messages.list;
  const trashTabHref = `${ROUTES.messages.list}?vue=corbeille`;

  const currentQuery = searchParams.toString();
  const conversationLinkSuffix = currentQuery ? `?${currentQuery}` : "";
  void pathname;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-border/60 bg-surface px-2 pt-2 pb-2">
        <TabLink
          href={activeTabHref}
          active={view === "active"}
          icon={<Inbox className="size-4" aria-hidden />}
          label="Boîte"
        />
        <TabLink
          href={trashTabHref}
          active={view === "archived"}
          icon={<Trash2 className="size-4" aria-hidden />}
          label="Corbeille"
        />
      </div>

      <ul className="flex-1 overflow-y-auto" aria-label="Conversations">
        {conversations.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-muted">
            {view === "active"
              ? "Aucune conversation pour l'instant."
              : "La corbeille est vide. Les conversations supprimées y restent 30 jours."}
          </li>
        ) : (
          conversations.map((conv) => {
            const isSelected = conv.conversation_id === selectedId;
            const isMine = conv.last_message_sender_id === currentUserId;
            const unread = !isMine && conv.unread_count > 0;
            const Icon = conv.context_type
              ? CONTEXT_ICON[conv.context_type]
              : MessageCircle;
            const contextLabel = conv.context_type
              ? CONTEXT_LABEL[conv.context_type]
              : "Message";
            const otherName = conv.other_display_name ?? "Voisin·e";
            const preview = conv.last_message_preview ?? "Pas encore de message";
            const previewPrefix = isMine ? "Vous : " : "";

            return (
              <li
                key={conv.conversation_id}
                className={cn(
                  "border-b border-border/40",
                  isSelected && "bg-soft-pink/60",
                )}
              >
                <div className="group/item relative flex items-stretch">
                  <Link
                    href={`${ROUTES.messages.detail(conv.conversation_id)}${conversationLinkSuffix}`}
                    className={cn(
                      "min-w-0 flex-1 px-4 py-3 outline-none transition focus-visible:bg-warm",
                      !isSelected && "hover:bg-warm/60",
                    )}
                    aria-current={isSelected ? "page" : undefined}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar name={otherName} url={conv.other_avatar_url} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={cn(
                              "truncate text-sm",
                              unread
                                ? "font-bold text-text"
                                : "font-semibold text-text",
                            )}
                          >
                            {otherName}
                          </p>
                          <span className="shrink-0 text-[11px] font-medium text-muted">
                            {conv.last_message_at ? (
                              <RelativeTime iso={conv.last_message_at} />
                            ) : (
                              ""
                            )}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-purple">
                          <Icon className="size-3" aria-hidden />
                          <span className="truncate">
                            {contextLabel}
                            {conv.title ? ` · ${conv.title}` : ""}
                          </span>
                          {conv.context_available === false && (
                            <span className="ml-1 rounded-full bg-coral/10 px-1.5 py-0.5 text-[9px] font-bold text-coral">
                              Suspendu
                            </span>
                          )}
                        </div>
                        <p
                          className={cn(
                            "mt-1 line-clamp-2 text-xs",
                            unread ? "text-text" : "text-muted",
                          )}
                        >
                          {previewPrefix}
                          {preview}
                        </p>
                      </div>
                      {unread ? (
                        <span
                          aria-label={`${conv.unread_count} non lus`}
                          className="ml-1 mt-1 inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-coral px-1.5 text-[10px] font-bold text-white"
                        >
                          {conv.unread_count > 99 ? "99+" : conv.unread_count}
                        </span>
                      ) : null}
                    </div>
                  </Link>

                  <div className="absolute right-2 top-2">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          if (view === "archived") {
                            await restoreConversation(conv.conversation_id);
                          } else {
                            await archiveConversation(conv.conversation_id);
                          }
                        })
                      }
                      className={cn(
                        "cursor-pointer rounded-sm bg-surface/80 p-1.5 text-muted opacity-0 shadow-card transition hover:bg-warm hover:text-text",
                        "group-hover/item:opacity-100 focus-visible:opacity-100",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                      )}
                      aria-label={
                        view === "archived"
                          ? "Restaurer la conversation"
                          : "Supprimer la conversation"
                      }
                      title={
                        view === "archived"
                          ? "Restaurer"
                          : "Supprimer (corbeille 30 jours)"
                      }
                    >
                      {view === "archived" ? (
                        <ArchiveRestore className="size-4" aria-hidden />
                      ) : (
                        <Archive className="size-4" aria-hidden />
                      )}
                    </button>
                  </div>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

function TabLink({
  href,
  active,
  label,
  icon,
}: {
  href: string;
  active: boolean;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-sm px-3 py-2 text-sm font-semibold transition",
        active
          ? "bg-soft-pink text-purple"
          : "text-muted hover:bg-warm hover:text-text",
      )}
    >
      {icon}
      {label}
    </Link>
  );
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className="size-10 shrink-0 rounded-full border border-border object-cover"
      />
    );
  }
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-soft-pink text-sm font-bold text-purple">
      {initials || "?"}
    </div>
  );
}
