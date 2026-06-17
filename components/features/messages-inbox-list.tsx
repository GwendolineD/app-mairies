"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArchiveRestore, Megaphone, Sparkles, CalendarDays, MessageCircle, Inbox, Trash2, X } from "lucide-react";
import {
  archiveConversation,
  restoreConversation,
  permanentlyDeleteConversation,
} from "@/lib/actions/messages";
import { ROUTES } from "@/lib/constants/routes";
import type {
  ConversationContextType,
  ConversationInboxItem,
} from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { RelativeTime } from "@/components/ui/relative-time";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

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
  const [pending, startTransition] = useTransition();
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);

  // Tab links always return to the inbox root. Switching tabs from inside a thread
  // leaves the thread (the right pane no longer relates to the tab being switched to).
  const activeTabHref = ROUTES.messages.list;
  const trashTabHref = `${ROUTES.messages.list}?vue=corbeille`;

  const conversationLinkSuffix = view === "archived" ? "?vue=corbeille" : "";

  const handlePermanentDelete = (conversationId: string) => {
    startTransition(async () => {
      await permanentlyDeleteConversation(conversationId);
      setDeleteModalId(null);
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center border-b border-border/60 bg-surface">
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

      {view === "archived" && (
        <div className="shrink-0 border-b border-border/60 bg-warm/50 px-3 py-2 text-center text-xs text-muted">
          Les conversations supprimées sont conservées 30 jours.
        </div>
      )}

      <ul className="flex-1 overflow-y-auto" aria-label="Conversations">
        {conversations.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-muted">
            {view === "active"
              ? "Aucune conversation pour l'instant."
              : "La corbeille est vide."}
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
                  isSelected && "border-l-4 border-l-purple bg-soft-pink/60",
                )}
              >
                <div className="group/item relative flex items-stretch">
                  <Link
                    href={`${ROUTES.messages.detail(conv.conversation_id)}${conversationLinkSuffix}`}
                    className={cn(
                      "min-w-0 flex-1 px-3 py-3 outline-none transition focus-visible:bg-warm",
                      !isSelected && "hover:bg-warm/60",
                    )}
                    aria-current={isSelected ? "page" : undefined}
                  >
                    <div className="flex items-start gap-3">
                      <ContextPhoto url={conv.context_photo_url} title={conv.title} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-purple">
                            <Icon className="size-3 shrink-0" aria-hidden />
                            <span className="truncate">
                              {contextLabel}
                              {conv.title ? ` · ${conv.title}` : ""}
                            </span>
                          </div>
                          <span className="shrink-0 text-[11px] font-medium text-muted">
                            {conv.last_message_at ? (
                              <RelativeTime iso={conv.last_message_at} />
                            ) : (
                              ""
                            )}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <SmallAvatar name={otherName} url={conv.other_avatar_url} />
                          <p
                            className={cn(
                              "truncate text-xs font-medium",
                              unread ? "text-text" : "text-muted",
                            )}
                          >
                            {otherName}
                          </p>
                          {unread ? (
                            <span
                              aria-label={`${conv.unread_count} non lus`}
                              className="ml-auto inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-coral px-1.5 text-[10px] font-bold text-white"
                            >
                              {conv.unread_count > 99 ? "99+" : conv.unread_count}
                            </span>
                          ) : null}
                        </div>
                        <p
                          className={cn(
                            "mt-1 line-clamp-1 text-xs",
                            unread ? "text-text" : "text-muted",
                          )}
                        >
                          {previewPrefix}
                          {preview}
                        </p>
                      </div>
                    </div>
                  </Link>

                  <div className="absolute right-2 bottom-2 flex items-center gap-1">
                    {view === "archived" ? (
                      <>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              await restoreConversation(conv.conversation_id);
                            })
                          }
                          className={cn(
                            "cursor-pointer rounded-sm bg-surface/80 p-1.5 text-muted opacity-0 shadow-card transition hover:bg-warm hover:text-text",
                            "group-hover/item:opacity-100 focus-visible:opacity-100",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                          )}
                          aria-label="Restaurer la conversation"
                          title="Restaurer"
                        >
                          <ArchiveRestore className="size-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => setDeleteModalId(conv.conversation_id)}
                          className={cn(
                            "cursor-pointer rounded-sm bg-surface/80 p-1.5 text-muted opacity-0 shadow-card transition hover:bg-coral hover:text-white",
                            "group-hover/item:opacity-100 focus-visible:opacity-100",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                          )}
                          aria-label="Supprimer définitivement"
                          title="Supprimer définitivement"
                        >
                          <X className="size-4" aria-hidden />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            await archiveConversation(conv.conversation_id);
                          })
                        }
                        className={cn(
                          "cursor-pointer rounded-sm bg-surface/80 p-1.5 text-muted opacity-0 shadow-card transition hover:bg-warm hover:text-text",
                          "group-hover/item:opacity-100 focus-visible:opacity-100",
                          "disabled:cursor-not-allowed disabled:opacity-50",
                        )}
                        aria-label="Supprimer la conversation"
                        title="Supprimer (corbeille 30 jours)"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })
        )}
      </ul>

      <Modal
        open={deleteModalId !== null}
        onClose={() => setDeleteModalId(null)}
        title="Supprimer définitivement"
      >
        <p className="text-sm text-muted">
          Cette conversation sera définitivement supprimée. Cette action est
          irréversible.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteModalId(null)}
          >
            Annuler
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={pending}
            onClick={() => deleteModalId && handlePermanentDelete(deleteModalId)}
          >
            {pending ? "Suppression…" : "Supprimer"}
          </Button>
        </div>
      </Modal>
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
        "flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold transition",
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

function ContextPhoto({ url, title }: { url: string | null; title: string | null }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className="block size-14 shrink-0 rounded-sm border border-border object-cover"
      />
    );
  }
  return (
    <div className="flex size-14 shrink-0 items-center justify-center rounded-sm bg-soft-pink text-lg font-bold text-purple">
      {title?.[0]?.toUpperCase() || "?"}
    </div>
  );
}

function SmallAvatar({ name, url }: { name: string; url: string | null }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className="block size-5 shrink-0 rounded-full border border-border object-cover"
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
    <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-soft-pink text-[9px] font-bold text-purple">
      {initials?.[0] || "?"}
    </div>
  );
}
