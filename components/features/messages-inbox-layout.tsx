import { Suspense } from "react";
import { MessagesShellAuto } from "@/components/features/messages-shell-auto";
import { MessagesInboxAsync } from "@/components/features/messages-inbox-async";
import { MessagesInboxSkeleton } from "@/components/features/messages-skeletons";
import type { InboxView } from "@/lib/constants/inbox-views";

/**
 * Shared body of the `(boite)` and `corbeille` layouts.
 * The list lives here so it persists while the user switches conversation;
 * `children` is the pane (index page or `[id]` page).
 */
export function MessagesInboxLayout({
  view,
  children,
}: {
  view: InboxView;
  children: React.ReactNode;
}) {
  return (
    <MessagesShellAuto
      list={
        <Suspense fallback={<MessagesInboxSkeleton />}>
          <MessagesInboxAsync view={view} />
        </Suspense>
      }
      pane={children}
    />
  );
}
