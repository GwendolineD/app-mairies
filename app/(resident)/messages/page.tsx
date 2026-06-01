import Link from "next/link";
import { requireActiveMembership } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { ListGrid, PageStack } from "@/components/ui/page-stack";
import { PageHeading } from "@/components/ui/page-heading";
import { formatRelativeTime } from "@/lib/utils/date";

export default async function MessagesListePage() {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();

  const { data: participations } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", ctx.userId);

  const conversationIds = (participations ?? []).map((p) => p.conversation_id);
  if (conversationIds.length === 0) {
    return (
      <PageStack gap="4">
        <PageHeading
          title="Messages"
          subtitle="Contactez un·e voisin·e depuis une annonce."
        />
        <Card className="p-5 text-sm text-muted">
          Aucune conversation pour l&apos;instant.
        </Card>
      </PageStack>
    );
  }

  const { data } = await supabase
    .from("conversations")
    .select("id, title, updated_at, context_type, context_id")
    .eq("commune_id", ctx.activeMembership!.commune_id)
    .in("id", conversationIds)
    .order("updated_at", { ascending: false });

  const list = data ?? [];

  return (
    <PageStack gap="4">
      <PageHeading title="Messages" subtitle="Vos échanges autour des annonces." />
      <ListGrid className="md:grid-cols-2">
        {list.map((conv) => (
          <Link href={ROUTES.messages.detail(conv.id)} key={conv.id}>
            <Card className="p-4 transition hover:border-purple/40">
              <p className="text-lg font-semibold text-text">
                {conv.title ?? "Conversation"}
              </p>
              <p className="mt-1 text-xs text-muted">
                {formatRelativeTime(conv.updated_at)}
              </p>
            </Card>
          </Link>
        ))}
      </ListGrid>
    </PageStack>
  );
}
