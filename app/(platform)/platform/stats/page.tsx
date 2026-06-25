import { APP_NAME } from "@/lib/constants/app";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";

export default async function PlatformStatsPage() {
  const supabase = await createClient();

  const { count: eventsCount } = await supabase
    .from("analytics_events")
    .select("*", { count: "exact", head: true });

  const { count: communesActive } = await supabase
    .from("communes")
    .select("*", { count: "exact", head: true })
    .eq("subscription_status", "active");

  return (
    <div className="space-y-4">
      <PageHeading title="Statistiques globales" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="space-y-1 p-5">
          <p className="text-[10px] font-semibold uppercase text-muted">
            Communautés ouvertes
          </p>
          <p className="text-5xl font-bold text-purple">{communesActive ?? "—"}</p>
        </Card>
        <Card className="space-y-1 p-5">
          <p className="text-[10px] font-semibold uppercase text-muted">
            Événements analytics (lifetime)
          </p>
          <p className="text-5xl font-bold text-aqua">{eventsCount ?? "—"}</p>
        </Card>
      </div>
      <p className="text-sm font-medium text-muted">
        Les agrégats détaillés (parcours inscription, carte, signalements) seront reliés aux
        outils métier {APP_NAME} lors de la mise en ligne progressive.
      </p>
    </div>
  );
}
