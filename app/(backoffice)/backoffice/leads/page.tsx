import { requirePlatformAdmin } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";
import { LEAD_STAFF_REVIEW_STATUS_LABELS } from "@/lib/constants/staff-review-status";
import type { SupportRequestStatus } from "@/lib/types";
import { formatShortDate } from "@/lib/datetime";
import { listLeadsPage } from "@/lib/queries/commune-interest-leads";
import { parseLeadsListParams } from "@/lib/utils/backoffice-leads-params";
import { LeadsListPagination } from "@/components/features/backoffice/leads-list-pagination";
import { BackofficeLeadActions } from "./_components/backoffice-lead-actions";

export const dynamic = "force-dynamic";

export default async function BackofficeLeadsPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePlatformAdmin();
  const rawSearchParams = await props.searchParams;
  const params = parseLeadsListParams(rawSearchParams);
  const supabase = await createClient();
  const { items: rows, totalCount } = await listLeadsPage(supabase, params);

  return (
    <PageStack>
      <PageHeading
        title="Leads pré-inscription"
        subtitle="Intérêt manifesté avant activation complète d'une commune : contactez vos partenaires locaux lorsque la charge le permet."
      />
      <div className="space-y-2">
        {rows.length === 0 ? (
          <Card className="rounded-xl p-6 text-sm font-medium text-muted">
            Aucune demande récente.
          </Card>
        ) : (
          rows.map((lead) => {
            const statusMeta =
              LEAD_STAFF_REVIEW_STATUS_LABELS[lead.status as SupportRequestStatus];

            return (
              <Card key={lead.id} className="space-y-3 rounded-xl p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${statusMeta.className}`}
                    >
                      {statusMeta.label}
                    </span>
                    <p className="truncate font-semibold text-text">
                      {lead.email}
                    </p>
                  </div>
                  <span className="text-xs text-muted">
                    {formatShortDate(lead.created_at)}
                  </span>
                </div>
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
                <BackofficeLeadActions
                  leadId={lead.id}
                  status={lead.status as SupportRequestStatus}
                  initialComment={lead.admin_comment}
                />
              </Card>
            );
          })
        )}
      </div>

      <LeadsListPagination
        params={params}
        totalCount={totalCount}
        basePath={ROUTES.backoffice.leads}
      />
    </PageStack>
  );
}
