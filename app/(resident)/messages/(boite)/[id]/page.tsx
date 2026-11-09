import { requireActiveMembership } from "@/lib/auth/session";
import { ConversationPane } from "@/components/features/conversation-pane";

export default async function ConversationDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const ctx = await requireActiveMembership();

  return (
    <ConversationPane
      conversationId={id}
      currentUserId={ctx.userId}
      communeId={ctx.activeMembership!.commune_id}
    />
  );
}
