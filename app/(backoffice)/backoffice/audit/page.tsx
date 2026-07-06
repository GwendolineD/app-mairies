import { Monitor, Smartphone, Tablet } from "lucide-react";
import {
  BackofficeListPagination,
  BackofficeListResultCount,
} from "@/components/features/backoffice/backoffice-list-toolbar";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";
import { requirePlatformAdmin } from "@/lib/auth/session";
import {
  BACKOFFICE_AUDIT_PAGE_SIZES,
  getAuditActionLabel,
  type AuditCategoryValue,
  type AuditSeverityValue,
} from "@/lib/constants/audit";
import { listAuditLogsPage } from "@/lib/queries/audit-logs";
import { createClient } from "@/lib/supabase/server";
import { formatShortDateTime } from "@/lib/datetime";
import { parseBackofficeAuditListParams } from "@/lib/utils/audit-search-params";
import { AuditLogDetail } from "./_components/audit-log-detail";
import { AuditLogToolbar } from "./_components/audit-log-toolbar";
import { AuditMetaBadge } from "./_components/audit-meta-badge";

export const dynamic = "force-dynamic";

function DeviceIcon({ deviceType }: { deviceType: string | null }) {
  if (deviceType === "mobile") {
    return <Smartphone className="size-3.5" aria-hidden />;
  }
  if (deviceType === "tablet") {
    return <Tablet className="size-3.5" aria-hidden />;
  }
  return <Monitor className="size-3.5" aria-hidden />;
}

function formatDeviceLabel(
  deviceType: string | null,
  osName: string | null,
  browserName: string | null,
): string {
  const parts = [
    deviceType === "mobile"
      ? "Mobile"
      : deviceType === "tablet"
        ? "Tablette"
        : deviceType === "desktop"
          ? "Desktop"
          : null,
    osName,
    browserName,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : "Inconnu";
}

export default async function BackofficeAuditPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePlatformAdmin();

  const searchParams = (await props.searchParams) ?? {};
  const params = parseBackofficeAuditListParams(searchParams);
  const supabase = await createClient();
  const { items, totalCount } = await listAuditLogsPage(supabase, params);

  const listQueryProps = {
    params,
    queryVariant: "audit" as const,
    totalCount,
    pageSize: params.limit,
    limitOptions: BACKOFFICE_AUDIT_PAGE_SIZES,
  };

  return (
    <PageStack>
      <PageHeading
        title="Audit logs"
        subtitle="Historique des actions sensibles : authentification, modération, administration et contenu."
      />

      <AuditLogToolbar params={params} />

      <BackofficeListResultCount {...listQueryProps} />

      {items.length === 0 ? (
        <Card className="p-6 text-sm font-medium text-muted">
          Aucun log ne correspond à vos filtres.
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((log) => {
            const severity = log.severity as AuditSeverityValue;
            const category = log.category as AuditCategoryValue;

            return (
              <Card key={log.id} className="gap-2 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <AuditMetaBadge kind="severity" value={severity} />
                    <AuditMetaBadge kind="category" value={category} />
                    {!log.success ? (
                      <span className="rounded-full bg-coral/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-coral">
                        Échec
                      </span>
                    ) : null}
                  </div>
                  <span className="text-xs font-medium text-muted">
                    {formatShortDateTime(log.created_at)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">
                    <p className="text-sm font-semibold text-text">
                      {getAuditActionLabel(log.action)}
                    </p>

                    <p className="text-sm font-medium text-muted">
                      <span className="text-subtle">Utilisateur</span>
                      {" · "}
                      <span className="text-text">
                        {log.actor_display_name ?? "Anonyme"}
                      </span>
                    </p>

                    {log.commune_name ? (
                      <p className="text-sm font-medium text-muted">
                        <span className="text-subtle">Commune</span>
                        {" · "}
                        <span className="text-text">{log.commune_name}</span>
                      </p>
                    ) : null}

                    {log.target_type ? (
                      <p className="text-sm font-medium text-muted">
                        <span className="text-subtle">Cible</span>
                        {" · "}
                        <span className="text-text">
                          {log.target_type}
                          {log.target_id ? ` (${log.target_id.slice(0, 8)}…)` : ""}
                        </span>
                      </p>
                    ) : null}
                  </div>

                  <div className="ml-auto flex shrink-0 items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-warm px-2.5 py-1 text-xs font-medium text-muted">
                      <DeviceIcon deviceType={log.device_type} />
                      {formatDeviceLabel(
                        log.device_type,
                        log.os_name,
                        log.browser_name,
                      )}
                    </span>

                    {log.ip_address ? (
                      <span className="text-xs font-medium text-subtle">
                        IP · {log.ip_address}
                      </span>
                    ) : null}
                  </div>
                </div>

                <AuditLogDetail
                  metadata={log.metadata}
                  userAgent={log.user_agent}
                  success={log.success}
                />
              </Card>
            );
          })}
        </div>
      )}

      <BackofficeListPagination {...listQueryProps} />
    </PageStack>
  );
}
