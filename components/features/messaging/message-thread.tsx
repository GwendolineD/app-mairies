import { notFound } from "next/navigation";
import { getThread } from "@/lib/data/messages";
import { MessageThreadClient } from "./message-thread-client";

type Props = {
  conversationId: string;
  currentUserId: string;
};

export async function MessageThread({ conversationId, currentUserId }: Props) {
  const thread = await getThread(conversationId, currentUserId);
  if (!thread) notFound();

  return (
    <MessageThreadClient
      conversationId={thread.id}
      currentUserId={currentUserId}
      otherParticipant={thread.otherParticipant}
      contextType={thread.context_type}
      contextId={thread.context_id}
      contextTitle={thread.title}
      initialMessages={thread.messages}
    />
  );
}
