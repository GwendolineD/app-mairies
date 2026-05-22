import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

export default async function PlatformLeadsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("commune_interest_leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = data ?? [];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Leads pré-inscription</h2>
      <p className="text-xs text-muted">
        Intérêt manifesté avant activation complète d&apos;une commune : contactez vos
        partenaires locaux lorsque la charge le permet.
      </p>
      <div className="space-y-2">
        {rows.length === 0 ? (
          <Card className="p-6 text-sm text-muted">Aucune demande récente.</Card>
        ) : (
          rows.map((lead) => (
            <Card key={lead.id} className="space-y-2 p-4 text-sm">
              <p className="font-semibold text-text">{lead.email}</p>
              <p className="text-xs text-muted">
                INSEE {lead.insee_code ?? "—"} · commune #{lead.commune_id?.slice(0, 8) ?? "?"}
              </p>
              {lead.message ? (
                <p className="rounded-2xl bg-warm p-3 text-xs text-muted">{lead.message}</p>
              ) : null}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
