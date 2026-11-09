import { ConversationPaneSkeleton } from "@/components/features/messages-skeletons";

/** Pane-only fallback: shown while a conversation (or the index) loads. */
export default function Loading() {
  return <ConversationPaneSkeleton />;
}
