import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";
import { formatShortDate } from "@/lib/utils/format-date";
import { BackofficeReportActions } from "./_components/backoffice-report-actions";

const CONTEXT_TYPE_LABELS: Record<string, string> = {
  announcement: "Annonce",
  initiative: "Initiative",
  event: "Événement",
  user: "Utilisateur",
};

function contextLink(contextType: string, contextId: string): string | null {
  if (contextType === "announcement") return ROUTES.annonces.detail(contextId);
  if (contextType === "initiative") return ROUTES.initiatives.detail(contextId);
  if (contextType === "event") return ROUTES.evenements.detail(contextId);
  return null;
}

export default async function BackofficeSignalementsPage() {
  await requirePlatformAdmin();
  const supabase = await createClient();

  const { data: reports } = await supabase
    .from("reports")
    .select(
      `*, reporter_membership:memberships!reports_reporter_membership_id_fkey(
        profiles:profiles!memberships_profiles_user_id_fkey(display_name, first_name, last_name)
      ), commune:communes!reports_commune_id_fkey(name)`,
    )
    .order("created_at", { ascending: false })
    .limit(100);

  // Fetch content titles
  const contentIds = (reports ?? [])
    .filter((r) => r.context_type !== "user")
    .map((r) => ({ type: r.context_type, id: r.context_id }));

  const titleMap: Record<string, string> = {};

  for (const table of ["announcements", "initiatives", "events"] as const) {
    const ctxType =
      table === "announcements" ? "announcement" :
      table === "initiatives" ? "initiative" : "event";
    const ids = contentIds.filter((c) => c.type === ctxType).map((c) => c.id);
    if (ids.length > 0) {
      const { data } = await supabase.from(table).select("id, title").in("id", ids);
      for (const row of data ?? []) {
        titleMap[row.id] = row.title;
      }
    }
  }

  return (
    <PageStack>
      <PageHeading
        title="Signalements (Plateforme)"
        subtitle="Tous les signalements de toutes les communes."
      />

      <div className="space-y-3">
        {(reports ?? []).length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted">
            Aucun signalement pour le moment.
          </Card>
        ) : (
          (reports ?? []).map((report) => {
            const reporterProfile = report.reporter_membership?.profiles;
            const reporterName =
              reporterProfile?.display_name ??
              [reporterProfile?.first_name, reporterProfile?.last_name]
                .filter(Boolean)
                .join(" ") ??
              "Inconnu";
            const contentTitle = titleMap[report.context_id] ?? null;
            const communeName = report.commune?.name ?? "–";
            const link = contextLink(report.context_type, report.context_id);
            const isPending = report.status === "pending";

            return (
              <Card key={report.id} className="space-y-3 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-purple/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-purple">
                      {CONTEXT_TYPE_LABELS[report.context_type] ?? report.context_type}
                    </span>
                    <span className="text-xs font-medium text-muted">
                      {communeName}
                    </span>
                    {isPending ? (
                      <span className="rounded-full bg-coral/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-coral">
                        En attente
                      </span>
                    ) : (
                      <span className="rounded-full bg-mint/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-mint">
                        {report.resolution ?? "Traité"}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted">
                    {formatShortDate(report.created_at)}
                  </span>
                </div>

                {contentTitle && (
                  <p className="text-sm font-semibold text-text">
                    {contentTitle}
                    {link && (
                      <Link
                        href={link}
                        className="ml-2 text-xs font-medium text-purple hover:underline"
                      >
                        Voir →
                      </Link>
                    )}
                  </p>
                )}

                <p className="text-sm text-muted">
                  <span className="font-medium text-text">Motif :</span>{" "}
                  {report.reason}
                </p>

                <p className="text-xs text-subtle">
                  Signalé par {reporterName}
                </p>

                {isPending && (
                  <BackofficeReportActions
                    reportId={report.id}
                    contextType={report.context_type}
                    contextId={report.context_id}
                  />
                )}
              </Card>
            );
          })
        )}
      </div>
    </PageStack>
  );
}
