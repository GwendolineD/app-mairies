import { Suspense } from "react";
import { requireActiveMembership } from "@/lib/auth/session";
import { PageStack } from "@/components/ui/page-stack";
import { MessageThread } from "@/components/features/messaging/message-thread";
import { MessageThreadSkeleton } from "@/components/features/messaging/message-thread-skeleton";

export default async function MessageThreadPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const ctx = await requireActiveMembership();

  return (
    <PageStack gap="4">
      <Suspense fallback={<MessageThreadSkeleton />}>
        <MessageThread conversationId={id} currentUserId={ctx.userId} />
      </Suspense>
    </PageStack>
  );
}
