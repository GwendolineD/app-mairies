import { requireActiveMembership } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

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
    <div className="flex flex-col gap-4 px-4 py-6">
      <h1 className="text-xl font-bold text-text">Messages</h1>
      <p className="text-xs text-muted">
        Liste des conversations de votre commune active — la messagerie complète arrive
        bientôt, avec prévisualisations et pièces jointes douces lorsque vos contraintes
        RGPD permettront l&apos;hébergement.
      </p>
      <section className="flex flex-col gap-3">
        {list.length === 0 ? (
          <Card className="p-5 text-sm leading-relaxed text-muted">
            Aucune conversation pour l&apos;instant : contactez un·e voisin·e depuis une
            annonce ou une initiative dans les prochaines versions.
          </Card>
        ) : (
          list.map((conv: { id: string; title: string | null }) => (
            <Card key={conv.id} className="p-4">
              <p className="font-semibold text-text">
                {conv.title ?? "Conversation sans titre encore"}
              </p>
              <p className="text-xs text-subtle mt-2">Réf&nbsp;: {conv.id}</p>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
