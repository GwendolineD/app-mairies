import { requireActiveMembership } from "@/lib/auth/session";
import { getInboxConversations } from "@/lib/queries/inbox";
import { isArchivedView, type InboxView } from "@/lib/constants/inbox-views";
import { MessagesInboxList } from "@/components/features/messages-inbox-list";

/**
 * Server component loading the inbox for one view.
 * Rendered inside <Suspense> by the inbox layout so the layout itself never
 * blocks navigation (session + RPC happen below the boundary).
 */
export async function MessagesInboxAsync({ view }: { view: InboxView }) {
  const ctx = await requireActiveMembership();
  const communeId = ctx.activeMembership!.commune_id;
  const { items, totalCount } = await getInboxConversations(
    communeId,
    isArchivedView(view),
  );

  return (
    <MessagesInboxList
      conversations={items}
      totalCount={totalCount}
      communeId={communeId}
      view={view}
      currentUserId={ctx.userId}
    />
  );
}
