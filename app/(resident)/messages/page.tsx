import { Suspense } from "react";
import { requireActiveMembership } from "@/lib/auth/session";
<<<<<<< HEAD
import { PageStack } from "@/components/ui/page-stack";
import { PageHeading } from "@/components/ui/page-heading";
import { ConversationList } from "@/components/features/messaging/conversation-list";
import { ConversationListSkeleton } from "@/components/features/messaging/conversation-list-skeleton";
=======
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";
import { MessagesShell } from "@/components/features/messages-shell";
import { MessagesInboxAsync } from "@/components/features/messages-inbox-async";
import {
  ConversationEmptyState,
  MessagesInboxSkeleton,
} from "@/components/features/messages-skeletons";
>>>>>>> preprod

export default async function MessagesListePage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await props.searchParams) ?? {};
  const view = sp.vue === "corbeille" ? "archived" : "active";

  // We render the shell + skeletons immediately. Auth resolution happens
  // upstream in the layout so we just need the userId/communeId here.
  const ctx = await requireActiveMembership();
  const communeId = ctx.activeMembership!.commune_id;

  return (
    <PageStack gap="4">
      <PageHeading
        title="Messages"
<<<<<<< HEAD
        subtitle="Vos échanges avec les voisin·es de votre commune."
      />
      <Suspense fallback={<ConversationListSkeleton />}>
        <ConversationList communeId={communeId} currentUserId={ctx.userId} />
      </Suspense>
=======
        subtitle="Vos échanges autour des annonces, initiatives et événements."
      />
      <MessagesShell
        mode="list"
        list={
          <Suspense fallback={<MessagesInboxSkeleton />}>
            <MessagesInboxAsync
              communeId={communeId}
              userId={ctx.userId}
              view={view}
            />
          </Suspense>
        }
        pane={<ConversationEmptyState />}
      />
>>>>>>> preprod
    </PageStack>
  );
}
