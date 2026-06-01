import { notFound } from "next/navigation";
import { requireActiveMembership } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";
import { BackLink } from "@/components/ui/back-link";
import { Card } from "@/components/ui/card";
import { ConversationThread } from "@/components/features/conversation-thread";
import { PageStack } from "@/components/ui/page-stack";
import type { MessageRow } from "@/lib/types";

export default async function ConversationDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const ctx = await requireActiveMembership();
  const supabase = await createClient();

  const { data: participant } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("conversation_id", id)
    .eq("user_id", ctx.userId)
    .maybeSingle();

  if (!participant) notFound();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, title, context_type, context_id")
    .eq("id", id)
    .eq("commune_id", ctx.activeMembership!.commune_id)
    .single();

  if (!conversation) notFound();

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  return (
    <PageStack gap="4">
      <BackLink href={ROUTES.messages.list}>← Messages</BackLink>
      <Card className="p-5">
        <h1 className="mb-4 text-xl font-bold text-text">
          {conversation.title ?? "Conversation"}
        </h1>
        <ConversationThread
          conversationId={id}
          messages={(messages ?? []) as MessageRow[]}
          currentUserId={ctx.userId}
        />
      </Card>
    </PageStack>
  );
}
