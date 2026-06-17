import { redirect } from "next/navigation";
import { requireActiveMembership } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { listMyConversations } from "@/lib/queries/messages";
import { ROUTES } from "@/lib/constants/routes";
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";
import { MessagesShell } from "@/components/features/messages-shell";
import { MessagesInboxList } from "@/components/features/messages-inbox-list";
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

  // Auto-select the first conversation if there are any
  if (conversations.length > 0) {
    const suffix = view === "archived" ? "?vue=corbeille" : "";
    redirect(ROUTES.messages.detail(conversations[0].conversation_id) + suffix);
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
            view={view}
            currentUserId={ctx.userId}
          />
        }
        pane={<ConversationEmptyState />}
      />
    </PageStack>
  );
}
