import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

export default async function MairieAccueilPage() {
  const ctx = await requireRole(["municipality_staff"]);

  const supabase = await createClient();
  const communeId = ctx.profile.active_commune_id;

  if (!communeId) {
    return (
      <p className="text-sm text-muted">
        Définissez une commune dans votre espace équipe Vie Locale avant de poursuivre.
      </p>
    );
  }

  const { count: announces } = await supabase
    .from("announcements")
    .select("id", { count: "exact", head: true })
    .eq("commune_id", communeId);

  const { count: reportsPending } = await supabase
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("commune_id", communeId)
    .eq("status", "pending");

  const { count: residents } = await supabase
    .from("memberships")
    .select("id", { count: "exact", head: true })
    .eq("commune_id", communeId)
    .eq("status", "active");

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4 space-y-1">
          <p className="text-[10px] font-semibold text-muted uppercase">Annonces</p>
          <p className="text-3xl font-black text-purple">{announces ?? 0}</p>
        </Card>
        <Card className="p-4 space-y-1">
          <p className="text-[10px] font-semibold text-muted uppercase">Alertes ouvertes</p>
          <p className="text-3xl font-black text-coral">{reportsPending ?? 0}</p>
        </Card>
        <Card className="p-4 space-y-1">
          <p className="text-[10px] font-semibold text-muted uppercase">
            Resident·es actifs
          </p>
          <p className="text-3xl font-black text-text">{residents ?? 0}</p>
        </Card>
      </div>
      <Card className="space-y-2 p-6">
        <h2 className="text-lg font-bold">Pilotage équipe</h2>
        <p className="text-sm leading-relaxed text-muted">
          Gardez le sourire même dans vos modérations&nbsp;: vos voisin·es repèrent vite quand une
          collectivité se montre précise et empathique simultanément.
        </p>
        <Link
          href="/mairie/signalements"
          className="inline-flex text-sm font-semibold text-purple"
        >
          Voir les signalements →
        </Link>
      </Card>
    </div>
  );
}
