import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireActiveMembership } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { listMyConversations } from "@/lib/queries/messages";
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";
import { MessagesShell } from "@/components/features/messages-shell";
import { MessagesInboxList } from "@/components/features/messages-inbox-list";
import { ConversationEmptyState } from "@/components/features/messages-skeletons";
import { ROUTES } from "@/lib/constants/routes";

async function isMobileRequest(): Promise<boolean> {
  const h = await headers();
  if (h.get("Sec-CH-UA-Mobile") === "?1") return true;
  const ua = h.get("user-agent") ?? "";
  return /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
}

export default async function MessagesListePage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await props.searchParams) ?? {};
  const view = sp.vue === "corbeille" ? "archived" : "active";

  const ctx = await requireActiveMembership();
  const communeId = ctx.activeMembership!.commune_id;

  const supabase = await createClient();
  const { items: conversations, totalCount } = await listMyConversations(
    supabase,
    communeId,
    { archived: view === "archived" },
  );

  const firstConversationId = conversations[0]?.conversation_id ?? null;
  const isMobile = await isMobileRequest();

  if (!isMobile && firstConversationId) {
    const suffix = view === "archived" ? "?vue=corbeille" : "";
    redirect(ROUTES.messages.detail(firstConversationId) + suffix);
  }

  return (
    <PageStack gap="2">
      <PageHeading
        title="Messages"
        subtitle="Vos échanges autour des annonces, initiatives et événements."
      />
      <MessagesShell
        mode="list"
        list={
          <MessagesInboxList
            conversations={conversations}
            totalCount={totalCount}
            communeId={communeId}
            view={view}
            currentUserId={ctx.userId}
          />
        }
        pane={<ConversationEmptyState />}
      />
    </PageStack>
  );
}
