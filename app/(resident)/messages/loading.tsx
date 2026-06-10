import { PageStack } from "@/components/ui/page-stack";
import { PageHeading } from "@/components/ui/page-heading";
import { ConversationListSkeleton } from "@/components/features/messaging/conversation-list-skeleton";

export default function MessagesLoading() {
  return (
    <PageStack gap="4">
      <PageHeading
        title="Messages"
        subtitle="Vos échanges avec les voisin·es de votre commune."
      />
      <ConversationListSkeleton />
    </PageStack>
  );
}
