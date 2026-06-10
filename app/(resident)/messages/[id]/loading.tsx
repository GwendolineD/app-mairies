import { PageStack } from "@/components/ui/page-stack";
import { MessageThreadSkeleton } from "@/components/features/messaging/message-thread-skeleton";

export default function MessageThreadLoading() {
  return (
    <PageStack gap="4">
      <MessageThreadSkeleton />
    </PageStack>
  );
}
