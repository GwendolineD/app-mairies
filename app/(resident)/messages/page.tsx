import { Suspense } from "react";
import { requireActiveMembership } from "@/lib/auth/session";
import { PageStack } from "@/components/ui/page-stack";
import { PageHeading } from "@/components/ui/page-heading";
import { ConversationList } from "@/components/features/messaging/conversation-list";
import { ConversationListSkeleton } from "@/components/features/messaging/conversation-list-skeleton";

export default async function MessagesListePage() {
  const ctx = await requireActiveMembership();
  const communeId = ctx.activeMembership!.commune_id;

  return (
    <PageStack gap="4">
      <PageHeading
        title="Messages"
        subtitle="Vos échanges avec les voisin·es de votre commune."
      />
      <Suspense fallback={<ConversationListSkeleton />}>
        <ConversationList communeId={communeId} currentUserId={ctx.userId} />
      </Suspense>
    </PageStack>
  );
}
