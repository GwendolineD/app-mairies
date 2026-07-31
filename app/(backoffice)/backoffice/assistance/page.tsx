import { requirePlatformAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { LinkifiedText } from "@/components/ui/linkified-text";
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";
import { STAFF_REVIEW_STATUS_LABELS } from "@/lib/constants/staff-review-status";
import type { SupportRequestStatus } from "@/lib/types";
import { formatShortDate } from "@/lib/datetime";
import { BackofficeSupportActions } from "./_components/backoffice-support-actions";

function authorName(firstName: string | null, lastName: string | null): string {
  const parts = [firstName, lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Non renseigné";
}

export default async function BackofficeAssistancePage() {
  await requirePlatformAdmin();
  const supabase = await createClient();

  const { data: requests } = await supabase
    .from("support_requests")
    .select("*, commune:communes!support_requests_commune_id_fkey(name)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <PageStack>
      <PageHeading
        title="Assistance"
        subtitle="Demandes d'aide, retours et signalements de bugs des résident·es."
      />

      <div className="space-y-3">
        {(requests ?? []).length === 0 ? (
          <Card className="rounded-xl p-6 text-center text-sm text-muted">
            Aucune demande d&apos;assistance pour le moment.
          </Card>
        ) : (
          (requests ?? []).map((request) => {
            const statusMeta = STAFF_REVIEW_STATUS_LABELS[request.status as SupportRequestStatus];
            const communeName = request.commune?.name ?? "–";
            const name = authorName(request.first_name, request.last_name);

            return (
              <Card key={request.id} className="space-y-3 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${statusMeta.className}`}
                    >
                      {statusMeta.label}
                    </span>
                    <span className="text-xs font-medium text-muted">{communeName}</span>
                  </div>
                  <span className="text-xs text-muted">
                    {formatShortDate(request.created_at)}
                  </span>
                </div>

                <p className="text-sm font-semibold text-text">{request.subject}</p>

                <LinkifiedText
                  text={request.message}
                  className="whitespace-pre-wrap text-sm text-muted"
                />

                <p className="text-xs text-subtle">
                  {name} · {request.user_email}
                </p>

                <BackofficeSupportActions
                  requestId={request.id}
                  status={request.status as SupportRequestStatus}
                  initialComment={request.admin_comment}
                />
              </Card>
            );
          })
        )}
      </div>
    </PageStack>
  );
}
