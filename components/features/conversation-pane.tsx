import Link from "next/link";
import { ArrowLeft, CalendarDays, ExternalLink, Megaphone, Sparkles } from "lucide-react";
import { ConversationThread } from "@/components/features/conversation-thread";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";
import { listConversationMessages } from "@/lib/queries/messages";
import type { ConversationContextType, MessageRow } from "@/lib/types";

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

const CONTEXT_TABLES: Record<ConversationContextType, string> = {
  announcement: "announcements",
  initiative: "initiatives",
  event: "events",
};

async function fetchContextPhotoUrl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  contextType: ConversationContextType | null,
  contextId: string | null,
): Promise<{ photoUrl: string | null; available: boolean }> {
  if (!contextType || !contextId) return { photoUrl: null, available: true };
  const table = CONTEXT_TABLES[contextType];
  const { data } = await supabase
    .from(table)
    .select("photo_url, suspended_at")
    .eq("id", contextId)
    .maybeSingle();
  const row = data as { photo_url: string | null; suspended_at: string | null } | null;
  return {
    photoUrl: row?.photo_url ?? null,
    available: row ? !row.suspended_at : false,
  };
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

  const [{ data: otherProfileRow }, messages, contextInfo] = await Promise.all([
    otherUserId
      ? supabase
          .from("profiles")
          .select("display_name, avatar_url")
          .eq("user_id", otherUserId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    listConversationMessages(supabase, conversationId),
    fetchContextPhotoUrl(
      supabase,
      conversation.context_type,
      conversation.context_id,
    ),
  ]);

  const contextPhotoUrl = contextInfo.photoUrl;
  const contextAvailable = contextInfo.available;
  const otherProfile = (otherProfileRow ?? null) as OtherProfile | null;
  const otherName = otherProfile?.display_name ?? "Voisin·e";

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
              <p className="flex items-center gap-1 truncate text-[11px] font-semibold uppercase tracking-wide text-purple">
                {ContextIcon ? (
                  <ContextIcon className="size-3 shrink-0" aria-hidden />
                ) : null}
                <span className="truncate">{conversation.title}</span>
              </p>
            ) : null}
            <div className="mt-0.5 flex items-center gap-1.5">
              <SmallAvatar
                name={otherName}
                url={otherProfile?.avatar_url ?? null}
              />
              <p className="truncate text-xs font-medium text-muted">
                {otherName}
              </p>
            </div>
          </div>
        </div>
        {contextAvailable && contextHref && contextLabel ? (
          <Link
            href={contextHref}
            className="inline-flex shrink-0 items-center gap-1 rounded-sm border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text transition hover:bg-warm"
          >
            <ExternalLink className="size-3" aria-hidden />
            <span className="hidden sm:inline">{contextLabel}</span>
          </Link>
        ) : !contextAvailable && conversation.context_type ? (
          <span className="shrink-0 rounded-full bg-coral/10 px-2.5 py-1 text-[10px] font-semibold text-coral">
            Contenu suspendu
          </span>
        ) : null}
      </header>

      <ConversationThread
        conversationId={conversationId}
        messages={messages as MessageRow[]}
        currentUserId={currentUserId}
        isArchived={isArchived}
        readOnly={!contextAvailable}
      />
    </div>
  );
}

function ContextPhoto({ url, title }: { url: string | null; title: string | null }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
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
