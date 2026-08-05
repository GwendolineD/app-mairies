import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CalendarDays, ExternalLink, Megaphone, Sparkles } from "lucide-react";
import { ConversationThread } from "@/components/features/conversation-thread";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";
import { buildOptimizedCloudinaryUrl } from "@/lib/services/cloudinary";
import { listConversationMessages } from "@/lib/queries/messages";
import type { ConversationContextStatus, ConversationContextType, MembershipStatus, MessageRow } from "@/lib/types";
import {
  getConversationReadOnlyMessage,
  getConversationStatusBadgeLabel,
} from "@/lib/utils/conversation-status-badge";

type ConversationRow = {
  id: string;
  title: string | null;
  context_type: ConversationContextType | null;
  context_id: string | null;
  participant_a: string | null;
  participant_b: string | null;
  commune_id: string;
};

type ParticipantInfo = {
  archived_at: string | null;
};

type OtherProfile = {
  display_name: string | null;
  avatar_url: string | null;
};

const CONTEXT_ROUTES: Record<ConversationContextType, (id: string) => string> = {
  announcement: (id) => ROUTES.annonces.detail(id),
  initiative: (id) => ROUTES.initiatives.detail(id),
  event: (id) => ROUTES.evenements.detail(id),
};

const CONTEXT_LABELS: Record<ConversationContextType, string> = {
  announcement: "Voir l'annonce",
  initiative: "Voir l'initiative",
  event: "Voir l'événement",
};

const CONTEXT_ICONS = {
  announcement: Megaphone,
  initiative: Sparkles,
  event: CalendarDays,
} as const;

const CONTEXT_TABLES = {
  announcement: "announcements",
  initiative: "initiatives",
  event: "events",
} as const satisfies Record<ConversationContextType, "announcements" | "initiatives" | "events">;

async function fetchContextInfo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  contextType: ConversationContextType | null,
  contextId: string | null,
): Promise<{
  photoUrl: string | null;
  available: boolean;
  contextStatus: ConversationContextStatus | null;
}> {
  if (!contextType || !contextId) {
    return { photoUrl: null, available: true, contextStatus: null };
  }
  const table = CONTEXT_TABLES[contextType];
  const { data } = await supabase
    .from(table as "announcements")
    .select("photo_url, suspended_at")
    .eq("id", contextId)
    .maybeSingle();
  const row = data as { photo_url: string | null; suspended_at: string | null } | null;
  if (!row) {
    return { photoUrl: null, available: false, contextStatus: "deleted" };
  }
  if (row.suspended_at) {
    return { photoUrl: row.photo_url, available: false, contextStatus: "suspended" };
  }
  return { photoUrl: row.photo_url, available: true, contextStatus: "available" };
}

/**
 * Server component for the right pane on `/messages/[id]`.
 *
 * Streams in via <Suspense> so the page shell + inbox list paint immediately.
 * Side effects (mark conversation as read) run server-side on render so the
 * unread indicator clears as soon as the user opens the thread.
 */
export async function ConversationPane({
  conversationId,
  currentUserId,
  communeId,
}: {
  conversationId: string;
  currentUserId: string;
  communeId: string;
}) {
  const supabase = await createClient();

  const [{ data: rawConv }, { data: participant }] = await Promise.all([
    supabase
      .from("conversations")
      .select(
        "id, title, context_type, context_id, participant_a, participant_b, commune_id",
      )
      .eq("id", conversationId)
      .eq("commune_id", communeId)
      .maybeSingle(),
    supabase
      .from("conversation_participants")
      .select("archived_at")
      .eq("conversation_id", conversationId)
      .eq("user_id", currentUserId)
      .maybeSingle(),
  ]);

  const conversation = rawConv as ConversationRow | null;
  const part = participant as ParticipantInfo | null;

  if (!conversation || !part) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-base font-semibold text-text">
          Conversation introuvable
        </p>
        <p className="text-sm text-muted">
          Vous n&apos;avez plus accès à cette conversation.
        </p>
        <Link
          href={ROUTES.messages.list}
          className="text-sm font-semibold text-purple underline"
        >
          ← Retour aux messages
        </Link>
      </div>
    );
  }

  const otherUserId =
    conversation.participant_a === currentUserId
      ? conversation.participant_b
      : conversation.participant_a;

  const [{ data: otherProfileRow }, messages, contextInfo, { data: otherMembershipRow }] =
    await Promise.all([
    otherUserId
      ? supabase
          .from("profiles")
          .select("display_name, avatar_url")
          .eq("user_id", otherUserId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    listConversationMessages(supabase, conversationId),
    fetchContextInfo(
      supabase,
      conversation.context_type,
      conversation.context_id,
    ),
    otherUserId
      ? supabase
          .from("memberships")
          .select("status")
          .eq("user_id", otherUserId)
          .eq("commune_id", communeId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const contextPhotoUrl = contextInfo.photoUrl;
  const contextAvailable = contextInfo.available;
  const contextStatus = contextInfo.contextStatus;
  const otherMembershipStatus = (otherMembershipRow?.status ?? null) as MembershipStatus | null;
  const otherProfile = (otherProfileRow ?? null) as OtherProfile | null;
  const otherAccountDeleted = otherUserId == null;
  const otherName = otherAccountDeleted
    ? "Ancien voisin"
    : (otherProfile?.display_name ?? "Voisin·e");
  const statusBadgeLabel = getConversationStatusBadgeLabel({
    context_status: contextStatus,
    other_membership_status: otherMembershipStatus,
    other_account_deleted: otherAccountDeleted,
  });
  const readOnlyMessage = getConversationReadOnlyMessage({
    context_status: contextStatus,
    other_membership_status: otherMembershipStatus,
    other_account_deleted: otherAccountDeleted,
  });

  // Mark conversation as read on render — best-effort, errors are ignored.
  // Direct DB update (not a server action) avoids mid-render revalidatePath.
  await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", currentUserId);

  const ContextIcon = conversation.context_type
    ? CONTEXT_ICONS[conversation.context_type]
    : null;
  const contextHref =
    conversation.context_type && conversation.context_id
      ? CONTEXT_ROUTES[conversation.context_type](conversation.context_id)
      : null;
  const contextLabel = conversation.context_type
    ? CONTEXT_LABELS[conversation.context_type]
    : null;

  const isArchived = !!part.archived_at;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={ROUTES.messages.list}
            className="cursor-pointer rounded-sm p-1.5 text-muted transition hover:bg-warm hover:text-text md:hidden"
            aria-label="Retour à la liste"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </Link>
          <ContextPhoto
            url={contextPhotoUrl}
            title={conversation.title}
          />
          <div className="min-w-0">
            {conversation.title ? (
              <p className="flex items-center gap-1 truncate text-[11px] font-semibold text-purple">
                {ContextIcon ? (
                  <ContextIcon className="size-3 shrink-0" aria-hidden />
                ) : null}
                <span className="truncate">{conversation.title}</span>
              </p>
            ) : null}
            <div className="mt-0.5 flex items-center gap-1.5">
              <SmallAvatar
                name={otherName}
                url={otherAccountDeleted ? null : (otherProfile?.avatar_url ?? null)}
              />
              <p className="truncate text-xs font-medium text-muted">
                {otherName}
              </p>
            </div>
          </div>
        </div>
        {statusBadgeLabel ? (
          <span className="shrink-0 rounded-full bg-coral/10 px-2.5 py-1 text-[10px] font-semibold text-coral">
            {statusBadgeLabel}
          </span>
        ) : contextAvailable && contextHref && contextLabel ? (
          <Link
            href={contextHref}
            className="inline-flex shrink-0 items-center gap-1 rounded-sm border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text transition hover:bg-warm"
          >
            <ExternalLink className="size-3" aria-hidden />
            <span className="hidden sm:inline">{contextLabel}</span>
          </Link>
        ) : null}
      </header>

      <ConversationThread
        conversationId={conversationId}
        messages={messages as MessageRow[]}
        currentUserId={currentUserId}
        isArchived={isArchived}
        readOnly={
          otherAccountDeleted ||
          !contextAvailable ||
          otherMembershipStatus === "suspended" ||
          otherMembershipStatus === "left"
        }
        readOnlyMessage={readOnlyMessage}
        departedBanner={
          otherAccountDeleted
            ? "Ce voisin a quitté la plateforme"
            : otherMembershipStatus === "left"
              ? "Ce voisin a quitté la commune"
              : undefined
        }
      />
    </div>
  );
}

function ContextPhoto({ url, title }: { url: string | null; title: string | null }) {
  if (url) {
    return (
      <Image
        src={buildOptimizedCloudinaryUrl(url, { width: 120 })}
        alt=""
        width={40}
        height={40}
        className="block size-10 shrink-0 rounded-sm border border-border object-cover"
      />
    );
  }
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-soft-pink text-sm font-bold text-purple">
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
