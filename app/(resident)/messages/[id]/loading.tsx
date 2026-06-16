<<<<<<< HEAD
import { PageStack } from "@/components/ui/page-stack";
import { MessageThreadSkeleton } from "@/components/features/messaging/message-thread-skeleton";

export default function MessageThreadLoading() {
  return (
    <PageStack gap="4">
      <MessageThreadSkeleton />
=======
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";
import { MessagesShell } from "@/components/features/messages-shell";
import {
  ConversationPaneSkeleton,
  MessagesInboxSkeleton,
} from "@/components/features/messages-skeletons";

export default function Loading() {
  return (
    <PageStack gap="4">
      <PageHeading
        title="Messages"
        subtitle="Vos échanges autour des annonces, initiatives et événements."
      />
      <MessagesShell
        mode="pane"
        list={<MessagesInboxSkeleton />}
        pane={<ConversationPaneSkeleton />}
      />
>>>>>>> preprod
    </PageStack>
  );
}
