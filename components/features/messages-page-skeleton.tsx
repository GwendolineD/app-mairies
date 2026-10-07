import { PageStack } from "@/components/ui/page-stack";
import { Skeleton } from "@/components/ui/skeleton";
import { MessagesShell } from "@/components/features/messages-shell";
import {
  ConversationPaneSkeleton,
  MessagesInboxSkeleton,
} from "@/components/features/messages-skeletons";

/**
 * Skeleton mirroring the messages list page while data loads.
 *
 * Reuses the real MessagesShell layout and existing inbox/pane skeletons so the
 * transition from this loading state to the actual page (or to /messages/[id]
 * after the desktop redirect) is visually seamless.
 */
export function MessagesPageSkeleton() {
  return (
    <PageStack gap="2">
      {/* Page heading */}
      <header className="space-y-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </header>

      <MessagesShell
        mode="list"
        list={<MessagesInboxSkeleton />}
        pane={<ConversationPaneSkeleton />}
      />
    </PageStack>
  );
}
