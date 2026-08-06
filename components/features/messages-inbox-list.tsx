"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { ArchiveRestore, Megaphone, Sparkles, CalendarDays, MessageCircle, Inbox, Trash2, X } from "lucide-react";
import {
  archiveConversation,
  fetchMoreConversations,
  permanentlyDeleteConversation,
  restoreConversation,
} from "@/lib/actions/messages";
import { ROUTES } from "@/lib/constants/routes";
import { CONTEXT_TYPE_LABELS } from "@/lib/constants/context-types";
import type {
  ConversationContextType,
  ConversationInboxItem,
} from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { RelativeTime } from "@/components/ui/relative-time";
import { LoadMoreLink } from "@/components/ui/load-more-link";
import { ArchiveConversationModal } from "@/components/features/archive-conversation-modal";
import { DeleteConversationModal } from "@/components/features/delete-conversation-modal";
import { getConversationStatusBadgeLabel } from "@/lib/utils/conversation-status-badge";
import { buildOptimizedCloudinaryUrl } from "@/lib/services/cloudinary";

const CONTEXT_ICON: Record<ConversationContextType, typeof MessageCircle> = {
  announcement: Megaphone,
  initiative: Sparkles,
  event: CalendarDays,
};

type Props = {
  conversations: ConversationInboxItem[];
  totalCount: number;
  communeId: string;
  view: "active" | "archived";
  selectedId?: string;
  currentUserId: string;
};

export function MessagesInboxList({
  conversations,
  totalCount,
  communeId,
  view,
  selectedId,
  currentUserId,
}: Props) {
  const [items, setItems] = useState(conversations);
  const [total, setTotal] = useState(totalCount);
  const [pending, startTransition] = useTransition();
  const [loadingMore, startLoadingMore] = useTransition();
  const [archiveModalId, setArchiveModalId] = useState<string | null>(null);
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);

  useEffect(() => {
    setItems(conversations);
    setTotal(totalCount);
  }, [conversations, totalCount, view]);

  const remaining = Math.max(0, total - items.length);

  function handleLoadMore() {
    startLoadingMore(async () => {
      const result = await fetchMoreConversations(communeId, {
        offset: items.length,
        archived: view === "archived",
      });
      setItems((prev) => {
        const existingIds = new Set(prev.map((c) => c.conversation_id));
        const unique = result.items.filter(
          (c) => !existingIds.has(c.conversation_id),
        );
        return [...prev, ...unique];
      });
      setTotal(result.totalCount);
    });
  }

  // Tab links always return to the inbox root.
  const activeTabHref = ROUTES.messages.list;
  const trashTabHref = `${ROUTES.messages.list}?vue=corbeille`;

  const conversationLinkSuffix = view === "archived" ? "?vue=corbeille" : "";

  const handleArchive = (conversationId: string) => {
    startTransition(async () => {
      await archiveConversation(conversationId);
      setArchiveModalId(null);
    });
  };

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
        {items.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-muted">
            {view === "active"
              ? "Aucune conversation pour l'instant."
              : "La corbeille est vide."}
          </li>
        ) : (
          items.map((conv) => {
            const isSelected = conv.conversation_id === selectedId;
            const isMine = conv.last_message_sender_id === currentUserId;
            const unread = !isMine && conv.unread_count > 0;
            const Icon = conv.context_type
              ? CONTEXT_ICON[conv.context_type]
              : MessageCircle;
            const contextLabel = conv.context_type
              ? CONTEXT_TYPE_LABELS[conv.context_type]
              : "Message";
            const otherName = conv.other_display_name ?? "Voisin·e";
            const isDepartedNeighbor = conv.other_account_deleted;
            const preview = conv.last_message_preview ?? "Pas encore de message";
            const previewPrefix = isMine ? "Vous : " : "";
            const statusLabel = getConversationStatusBadgeLabel(conv);

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
                          <div className="flex min-w-0 items-center gap-1 text-[11px] font-semibold text-purple">
                            <Icon className="size-3 shrink-0" aria-hidden />
                            <span className="flex min-w-0 items-baseline truncate">
                              <span className="shrink-0 uppercase tracking-wide">
                                {contextLabel}
                              </span>
                              {conv.title ? (
                                <>
                                  <span className="shrink-0"> · </span>
                                  <span className="truncate normal-case">{conv.title}</span>
                                </>
                              ) : null}
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
                              "min-w-0 flex-1 truncate text-xs font-medium",
                              isDepartedNeighbor
                                ? "text-subtle"
                                : unread
                                  ? "text-text"
                                  : "text-muted",
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
                        <div className="mt-1 flex items-center gap-2">
                          <p
                            className={cn(
                              "min-w-0 flex-1 truncate text-xs",
                              unread ? "text-text" : "text-muted",
                            )}
                          >
                            {previewPrefix}
                            {preview}
                          </p>
                          {statusLabel ? (
                            <span className="shrink-0 rounded-full bg-coral/10 px-1.5 py-0.5 text-[9px] font-bold text-coral">
                              {statusLabel}
                            </span>
                          ) : null}
                        </div>
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
                        onClick={() => setArchiveModalId(conv.conversation_id)}
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
        {remaining > 0 ? (
          <li className="flex justify-center px-4 py-4">
            <LoadMoreLink
              label={`${remaining} autre${remaining > 1 ? "s" : ""} conversation${remaining > 1 ? "s" : ""} · Voir plus`}
              onClick={handleLoadMore}
              pending={loadingMore}
            />
          </li>
        ) : null}
      </ul>

      <ArchiveConversationModal
        open={archiveModalId !== null}
        onClose={() => setArchiveModalId(null)}
        onConfirm={() => archiveModalId && handleArchive(archiveModalId)}
        pending={pending}
      />

      <DeleteConversationModal
        open={deleteModalId !== null}
        onClose={() => setDeleteModalId(null)}
        onConfirm={() => deleteModalId && handlePermanentDelete(deleteModalId)}
        pending={pending}
      />
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
      <Image
        src={buildOptimizedCloudinaryUrl(url, { width: 120 })}
        alt=""
        width={56}
        height={56}
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
      <Image
        src={buildOptimizedCloudinaryUrl(url, { width: 80 })}
        alt=""
        width={20}
        height={20}
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
