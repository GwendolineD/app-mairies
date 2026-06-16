import { createClient } from "@/lib/supabase/server";
import { listMyConversations } from "@/lib/queries/messages";
import { MessagesInboxList } from "@/components/features/messages-inbox-list";

/**
 * Server component fetching the inbox conversations and rendering the list.
 * Designed to be wrapped in <Suspense> so the surrounding shell renders first
 * with a skeleton fallback while the RPC executes.
 */
export async function MessagesInboxAsync({
  communeId,
  userId,
  view,
  selectedId,
}: {
  communeId: string;
  userId: string;
  view: "active" | "archived";
  selectedId?: string;
}) {
  const supabase = await createClient();
  const conversations = await listMyConversations(supabase, communeId, {
    archived: view === "archived",
  });

  return (
    <MessagesInboxList
      conversations={conversations}
      view={view}
      selectedId={selectedId}
      currentUserId={userId}
    />
  );
}
