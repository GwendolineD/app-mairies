import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { USER_ROLES } from "@/lib/constants/roles";
import {
  MEMBERSHIP_STATUS,
  REPORT_STATUS,
} from "@/lib/constants/statuses";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

export default async function MairieAccueilPage() {
  const ctx = await requireRole([USER_ROLES.municipalityStaff]);

  const supabase = await createClient();
  const communeId = ctx.profile.active_commune_id;

  if (!communeId) {
    return (
      <p className="text-base font-medium text-muted">
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
    .eq("status", REPORT_STATUS.pending);

  const { count: residents } = await supabase
    .from("memberships")
    .select("id", { count: "exact", head: true })
    .eq("commune_id", communeId)
    .eq("status", MEMBERSHIP_STATUS.active);

  return (
    <div className="space-y-4">
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
    </div>
  );
}
