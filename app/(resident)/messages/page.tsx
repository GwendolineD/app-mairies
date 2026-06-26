import { requireActiveMembership } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { listMyConversations } from "@/lib/queries/messages";
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";
import { MessagesShell } from "@/components/features/messages-shell";
import { MessagesInboxList } from "@/components/features/messages-inbox-list";
import { MessagesDesktopAutoSelect } from "@/components/features/messages-desktop-auto-select";
import { ConversationEmptyState } from "@/components/features/messages-skeletons";

export default async function MessagesListePage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await props.searchParams) ?? {};
  const view = sp.vue === "corbeille" ? "archived" : "active";

  const ctx = await requireActiveMembership();
  const communeId = ctx.activeMembership!.commune_id;

  const supabase = await createClient();
  const conversations = await listMyConversations(supabase, communeId, {
    archived: view === "archived",
  });

  const firstConversationId = conversations[0]?.conversation_id ?? null;

  return (
    <PageStack gap="2">
      {firstConversationId ? (
        <MessagesDesktopAutoSelect
          firstConversationId={firstConversationId}
          view={view}
        />
      ) : null}
      <PageHeading
        title="Messages"
        subtitle="Vos échanges autour des annonces, initiatives et événements."
      />
      <MessagesShell
        mode="list"
        list={
          <MessagesInboxList
            conversations={conversations}
            view={view}
            currentUserId={ctx.userId}
          />
        }
        pane={<ConversationEmptyState />}
      />
    </PageStack>
  );
}
