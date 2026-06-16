import { Suspense } from "react";
import { requireActiveMembership } from "@/lib/auth/session";
<<<<<<< HEAD
import { PageStack } from "@/components/ui/page-stack";
import { MessageThread } from "@/components/features/messaging/message-thread";
import { MessageThreadSkeleton } from "@/components/features/messaging/message-thread-skeleton";
=======
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";
import { MessagesShell } from "@/components/features/messages-shell";
import { MessagesInboxAsync } from "@/components/features/messages-inbox-async";
import { ConversationPane } from "@/components/features/conversation-pane";
import {
  ConversationPaneSkeleton,
  MessagesInboxSkeleton,
} from "@/components/features/messages-skeletons";
>>>>>>> preprod

export default async function MessageThreadPage(props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const view = sp.vue === "corbeille" ? "archived" : "active";

  const ctx = await requireActiveMembership();
<<<<<<< HEAD

  return (
    <PageStack gap="4">
      <Suspense fallback={<MessageThreadSkeleton />}>
        <MessageThread conversationId={id} currentUserId={ctx.userId} />
      </Suspense>
=======
  const communeId = ctx.activeMembership!.commune_id;

  return (
    <PageStack gap="4">
      <PageHeading
        title="Messages"
        subtitle="Vos échanges autour des annonces, initiatives et événements."
      />
      <MessagesShell
        mode="pane"
        list={
          <Suspense fallback={<MessagesInboxSkeleton />}>
            <MessagesInboxAsync
              communeId={communeId}
              userId={ctx.userId}
              view={view}
              selectedId={id}
            />
          </Suspense>
        }
        pane={
          <Suspense key={id} fallback={<ConversationPaneSkeleton />}>
            <ConversationPane
              conversationId={id}
              currentUserId={ctx.userId}
              communeId={communeId}
            />
          </Suspense>
        }
      />
>>>>>>> preprod
    </PageStack>
  );
}
