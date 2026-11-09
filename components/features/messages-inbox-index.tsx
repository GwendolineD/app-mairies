import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireActiveMembership } from "@/lib/auth/session";
import { getInboxConversations } from "@/lib/queries/inbox";
import { ROUTES } from "@/lib/constants/routes";
import { isArchivedView, type InboxView } from "@/lib/constants/inbox-views";
import { ConversationEmptyState } from "@/components/features/messages-skeletons";

async function isMobileRequest(): Promise<boolean> {
  const h = await headers();
  if (h.get("Sec-CH-UA-Mobile") === "?1") return true;
  const ua = h.get("user-agent") ?? "";
  return /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
}

/**
 * Pane content for the inbox index routes (`/messages`, `/messages/corbeille`).
 * Desktop: redirect to the first conversation of the view so both columns are
 * filled. Mobile: the layout shows the list; this empty state stays hidden.
 */
export async function MessagesInboxIndex({
  view,
  searchParams,
}: {
  view: InboxView;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  // Legacy URL `/messages?vue=corbeille` → dedicated trash route.
  if (view === "boite" && sp.vue === "corbeille") {
    redirect(ROUTES.messages.trash);
  }

  const ctx = await requireActiveMembership();
  const communeId = ctx.activeMembership!.commune_id;
  const { items } = await getInboxConversations(communeId, isArchivedView(view));

  const firstConversationId = items[0]?.conversation_id ?? null;
  if (firstConversationId && !(await isMobileRequest())) {
    redirect(ROUTES.messages.detail(firstConversationId, view));
  }

  return <ConversationEmptyState />;
}
