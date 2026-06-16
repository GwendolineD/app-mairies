import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";
import { PILOT_ACCESS_STATUSES } from "@/lib/constants/access-status";

export const dynamic = "force-dynamic";

export default async function BackofficeAdminHomePage() {
  const supabase = await createClient();

  const [{ count: communeCount }, { count: communesActive }, { count: eventsCount }] =
    await Promise.all([
      supabase
        .from("communes")
        .select("*", { count: "exact", head: true })
        .in("access_status", [...PILOT_ACCESS_STATUSES]),
      supabase
        .from("communes")
        .select("*", { count: "exact", head: true })
        .eq("access_status", "active"),
      supabase.from("analytics_events").select("*", { count: "exact", head: true }),
    ]);

  return (
    <PageStack>
      <PageHeading title="Dashboard" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="space-y-1 p-5">
          <p className="text-[10px] font-semibold uppercase text-muted">
            Communes pilotées
          </p>
          <p className="text-5xl font-bold text-purple">{communeCount ?? "—"}</p>
        </Card>
        <Card className="space-y-1 p-5">
          <p className="text-[10px] font-semibold uppercase text-muted">
            Communautés ouvertes
          </p>
          <p className="text-5xl font-bold text-mint">{communesActive ?? "—"}</p>
        </Card>
        <Card className="space-y-1 p-5 sm:col-span-2 lg:col-span-1">
          <p className="text-[10px] font-semibold uppercase text-muted">
            Événements analytics (lifetime)
          </p>
          <p className="text-5xl font-bold text-aqua">{eventsCount ?? "—"}</p>
        </Card>
      </div>
      <p className="text-sm font-medium text-muted">
        Les agrégats détaillés (parcours inscription, carte, signalements) seront reliés aux
        outils métier Vie Locale lors de la mise en ligne progressive.
      </p>
    </PageStack>
  );
}
