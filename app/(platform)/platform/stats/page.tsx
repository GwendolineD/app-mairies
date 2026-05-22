import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

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
      <h2 className="text-xl font-bold">Statistiques globales</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="p-5 space-y-1">
          <p className="text-[10px] font-semibold uppercase text-muted">
            Communautés ouvertes
          </p>
          <p className="text-3xl font-black text-purple">{communesActive ?? "—"}</p>
        </Card>
        <Card className="p-5 space-y-1">
          <p className="text-[10px] font-semibold uppercase text-muted">
            Événements analytics (lifetime)
          </p>
          <p className="text-3xl font-black text-aqua">{eventsCount ?? "—"}</p>
        </Card>
      </div>
      <p className="text-xs text-muted">
        Les agrégats détaillés (parcours inscription, carte, signalements) seront reliés aux
        outils métier Vie Locale lors de la mise en ligne progressive.
      </p>
    </div>
  );
}
