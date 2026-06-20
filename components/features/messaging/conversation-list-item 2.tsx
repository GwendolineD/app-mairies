import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants/routes";
import { CONTEXT_LABEL } from "@/lib/utils/conversation";
import { formatConversationTimestamp } from "@/lib/utils/date";
import { participantName } from "@/lib/utils/names";
import { cn } from "@/lib/utils/cn";
import type { ConversationListEntry } from "@/lib/types";

type Props = {
  entry: ConversationListEntry;
  currentUserId: string;
};

export function ConversationListItem({ entry, currentUserId }: Props) {
  const name = participantName(entry.otherParticipant);
  const unread = entry.unreadCount > 0;
  const lastFromMe = entry.lastMessage?.sender_id === currentUserId;
  const preview = entry.lastMessage
    ? `${lastFromMe ? "Vous : " : ""}${entry.lastMessage.body}`
    : "Démarrez la conversation";
  const time = formatConversationTimestamp(
    entry.lastMessage?.created_at ?? entry.updated_at,
  );

  return (
    <Link href={ROUTES.messages.detail(entry.id)} className="block">
      <Card
        className={cn(
          "flex items-center gap-3 p-4 transition hover:bg-warm/60",
          unread && "border-purple/30 bg-soft-pink/40",
        )}
      >
        <Avatar profile={entry.otherParticipant} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-base font-semibold text-text">{name}</p>
            <span className="shrink-0 text-xs font-medium text-subtle">
              {time}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <p
              className={cn(
                "min-w-0 flex-1 truncate text-sm",
                unread ? "font-semibold text-text" : "font-medium text-muted",
              )}
            >
              {preview}
            </p>
            {unread ? (
              <span className="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-bold leading-5 text-white gradient-hero">
                {entry.unreadCount}
              </span>
            ) : null}
          </div>
          {entry.context_type ? (
            <p className="mt-1 truncate text-xs font-medium text-subtle">
              {CONTEXT_LABEL[entry.context_type]}
              {entry.title ? ` · ${entry.title}` : ""}
            </p>
          ) : null}
        </div>
      </Card>
    </Link>
  );
}
