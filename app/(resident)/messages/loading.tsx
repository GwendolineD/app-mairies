<<<<<<< HEAD
import { PageStack } from "@/components/ui/page-stack";
import { PageHeading } from "@/components/ui/page-heading";
import { ConversationListSkeleton } from "@/components/features/messaging/conversation-list-skeleton";

export default function MessagesLoading() {
=======
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";
import { MessagesShell } from "@/components/features/messages-shell";
import {
  ConversationPaneSkeleton,
  MessagesInboxSkeleton,
} from "@/components/features/messages-skeletons";

export default function Loading() {
>>>>>>> preprod
  return (
    <PageStack gap="4">
      <PageHeading
        title="Messages"
<<<<<<< HEAD
        subtitle="Vos échanges avec les voisin·es de votre commune."
      />
      <ConversationListSkeleton />
=======
        subtitle="Vos échanges autour des annonces, initiatives et événements."
      />
      <MessagesShell
        mode="list"
        list={<MessagesInboxSkeleton />}
        pane={<ConversationPaneSkeleton />}
      />
>>>>>>> preprod
    </PageStack>
  );
}
