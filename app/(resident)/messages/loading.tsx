import { MessagesShell } from "@/components/features/messages-shell";
import {
  ConversationPaneSkeleton,
  MessagesInboxSkeleton,
} from "@/components/features/messages-skeletons";

/**
 * Prefetched fallback for the inbox block (list + pane).
 * Shown when entering `/messages/*` from another page and when switching
 * between the `(boite)` and `corbeille` segments. Not shown when only the
 * `[id]` segment changes. The heading is provided by the parent layout.
 */
export default function Loading() {
  return (
    <MessagesShell
      mode="list"
      list={<MessagesInboxSkeleton />}
      pane={<ConversationPaneSkeleton />}
    />
  );
}
