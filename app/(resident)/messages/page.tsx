import { requireActiveMembership } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { AssetPlaceholder } from "@/components/ui/asset-placeholder";
import { Card } from "@/components/ui/card";
import { ListGrid, PageStack } from "@/components/ui/page-stack";
import { PageHeading } from "@/components/ui/page-heading";

export default async function MessagesListePage() {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();

  const { data } = await supabase
    .from("conversations")
    .select("*")
    .eq("commune_id", ctx.activeMembership!.commune_id)
    .order("updated_at", { ascending: false });

  const list = data ?? [];

  return (
    <PageStack gap="4">
      <PageHeading
        title="Messages"
        subtitle="Liste des conversations de votre commune active — la messagerie complète arrive bientôt."
      />
      {list.length === 0 ? (
        <Card className="space-y-4 p-5">
          <AssetPlaceholder description="Aucune conversation — contactez un·e voisin·e depuis une annonce ou une initiative" />
          <p className="text-sm font-medium leading-5 text-muted">
            Aucune conversation pour l&apos;instant : contactez un·e voisin·e depuis une
            annonce ou une initiative dans les prochaines versions.
          </p>
        </Card>
      ) : (
        <ListGrid className="md:grid-cols-2">
          {list.map((conv: { id: string; title: string | null }) => (
            <Card key={conv.id} className="p-4">
              <p className="text-xl font-semibold leading-7 text-text">
                {conv.title ?? "Conversation sans titre encore"}
              </p>
              <p className="mt-2 text-xs font-medium text-subtle">Réf : {conv.id}</p>
            </Card>
          ))}
        </ListGrid>
      )}
    </PageStack>
  );
}
