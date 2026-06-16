import { requireRole } from "@/lib/auth/session";
import { USER_ROLES } from "@/lib/constants/roles";
import { REPORT_STATUS } from "@/lib/constants/statuses";
import { createClient } from "@/lib/supabase/server";
import { markReportHandledForm } from "@/lib/actions/municipality";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";

export default async function MairieSignalementsPage() {
  const ctx = await requireRole([USER_ROLES.municipalityStaff]);
  const communeId = ctx.profile.active_commune_id;
  if (!communeId) return null;

  const supabase = await createClient();

  const { data } = await supabase
    .from("reports")
    .select("*")
    .eq("commune_id", communeId)
    .order("created_at", { ascending: false });

  return (
    <PageStack>
      <PageHeading
        title="Signalements"
        subtitle="Chaque dossier reste lisible jusqu'à ce qu'un·e conseiller·ère valide votre relecture. Marquez comme revu après action humaine bienveillante."
      />

      <div className="space-y-3">
        {(data ?? []).map((report) => (
          <Card key={report.id} className="space-y-3 p-4">
            <div className="flex justify-between gap-4 text-[10px] font-semibold uppercase text-muted">
              <span>{report.context_type}</span>
              <span>{report.status}</span>
            </div>
            <p className="text-sm text-muted">{report.reason}</p>
            <form action={markReportHandledForm}>
              <input type="hidden" name="reportId" value={report.id} />
              <Button
                variant="secondary"
                type="submit"
                disabled={report.status !== REPORT_STATUS.pending}
                className="px-5 text-xs"
              >
                Marquer comme lu &amp; suivi équipe locale
              </Button>
            </form>
          </Card>
        ))}
      </div>
    </PageStack>
  );
}
