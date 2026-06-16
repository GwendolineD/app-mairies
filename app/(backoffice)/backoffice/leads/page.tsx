import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";

export const dynamic = "force-dynamic";

export default async function BackofficeLeadsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("commune_interest_leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = data ?? [];

  return (
    <PageStack>
      <PageHeading
        title="Leads pré-inscription"
        subtitle="Intérêt manifesté avant activation complète d'une commune : contactez vos partenaires locaux lorsque la charge le permet."
      />
      <div className="space-y-2">
        {rows.length === 0 ? (
          <Card className="p-6 text-sm font-medium text-muted">Aucune demande récente.</Card>
        ) : (
          rows.map((lead) => (
            <Card key={lead.id} className="space-y-2 p-4 text-sm">
              <p className="font-semibold text-text">{lead.email}</p>
              <p className="text-xs font-medium text-muted">
                INSEE {lead.insee_code ?? "—"}
                {typeof lead.metadata === "object" &&
                lead.metadata !== null &&
                "city" in lead.metadata &&
                typeof (lead.metadata as { city?: string }).city === "string"
                  ? ` · ${(lead.metadata as { city: string }).city}`
                  : null}
                {lead.commune_id
                  ? ` · commune #${lead.commune_id.slice(0, 8)}`
                  : null}
              </p>
              {lead.message ? (
                <p className="rounded-2xl bg-warm p-3 text-xs font-medium text-muted">
                  {lead.message}
                </p>
              ) : null}
            </Card>
          ))
        )}
      </div>
    </PageStack>
  );
}
