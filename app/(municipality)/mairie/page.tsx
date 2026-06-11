import Link from "next/link";
import { requireCommuneStaff } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import {
  MEMBERSHIP_STATUS,
  REPORT_STATUS,
} from "@/lib/constants/statuses";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";

export default async function MairieAccueilPage() {
  const { communeId } = await requireCommuneStaff();

  const supabase = await createClient();

  const { count: announces } = await supabase
    .from("announcements")
    .select("id", { count: "exact", head: true })
    .eq("commune_id", communeId);

  const { count: reportsPending } = await supabase
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("commune_id", communeId)
    .eq("status", REPORT_STATUS.pending);

  const { count: residents } = await supabase
    .from("memberships")
    .select("id", { count: "exact", head: true })
    .eq("commune_id", communeId)
    .eq("status", MEMBERSHIP_STATUS.active);

  return (
    <PageStack>
      <PageHeading title="Tableau de bord" />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="space-y-1 p-4">
          <p className="text-[10px] font-semibold uppercase text-muted">Annonces</p>
          <p className="text-5xl font-bold text-purple">{announces ?? 0}</p>
        </Card>
        <Card className="space-y-1 p-4">
          <p className="text-[10px] font-semibold uppercase text-muted">Alertes ouvertes</p>
          <p className="text-5xl font-bold text-coral">{reportsPending ?? 0}</p>
        </Card>
        <Card className="space-y-1 p-4">
          <p className="text-[10px] font-semibold uppercase text-muted">
            Resident·es actifs
          </p>
          <p className="text-5xl font-bold text-text">{residents ?? 0}</p>
        </Card>
      </div>

      <Card className="space-y-2 p-6">
        <h2 className="text-[28px] font-bold leading-9 text-text">Pilotage équipe</h2>
        <p className="text-base font-medium leading-6 text-muted">
          Gardez le sourire même dans vos modérations&nbsp;: vos voisin·es repèrent vite quand une
          collectivité se montre précise et empathique simultanément.
        </p>
        <Link
          href={ROUTES.mairie.signalements}
          className="inline-flex text-sm font-semibold text-purple underline"
        >
          Voir les signalements →
        </Link>
      </Card>
    </PageStack>
  );
}
