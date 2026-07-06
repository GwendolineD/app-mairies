"use client";

import { X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { resolveEndDateAfterStartChange } from "@/lib/datetime";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AUDIT_CATEGORIES,
  AUDIT_CATEGORY_LABELS,
  AUDIT_DEVICE_TYPES,
  AUDIT_SEVERITIES,
  AUDIT_SEVERITY_LABELS,
  type AuditCategoryValue,
  type AuditSeverityValue,
} from "@/lib/constants/audit";
import { buildBackofficeAuditListQuery } from "@/lib/utils/audit-search-params";
import type { BackofficeAuditListParams } from "@/lib/utils/audit-search-params";
import { AuditMetaBadge } from "./audit-meta-badge";

type AuditLogToolbarProps = {
  params: BackofficeAuditListParams;
};

const DEVICE_LABELS: Record<(typeof AUDIT_DEVICE_TYPES)[number], string> = {
  mobile: "Mobile",
  tablet: "Tablette",
  desktop: "Desktop",
};

export function AuditLogToolbar({ params }: AuditLogToolbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(params.q);

  function navigate(next: Partial<BackofficeAuditListParams>) {
    startTransition(() => {
      router.push(
        `${pathname}${buildBackofficeAuditListQuery({ ...params, page: 1, ...next })}`,
      );
    });
  }

  useEffect(() => {
    setSearch(params.q);
  }, [params.q]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (search === params.q) return;
      navigate({ q: search || undefined });
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [search, params.q]);

  function clearSearch() {
    setSearch("");
    navigate({ q: undefined });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative max-w-md w-full">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher action, cible…"
          className="rounded-sm pr-9"
          aria-label="Rechercher dans les logs"
        />
        {search.length > 0 ? (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm text-muted transition hover:text-text"
            aria-label="Effacer la recherche"
          >
            <X className="size-4" aria-hidden />
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          items={[
            { value: "all", label: "Toutes catégories" },
            ...AUDIT_CATEGORIES.map((category) => ({
              value: category,
              label: AUDIT_CATEGORY_LABELS[category],
            })),
          ]}
          value={params.category ?? "all"}
          onValueChange={(value) => {
            if (!value || value === "all") {
              navigate({ category: undefined });
              return;
            }
            navigate({ category: value as AuditCategoryValue });
          }}
        >
          <SelectTrigger className="min-w-40 rounded-sm">
            {params.category ? (
              <AuditMetaBadge kind="category" value={params.category} size="sm" />
            ) : (
              <SelectValue />
            )}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {AUDIT_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                <AuditMetaBadge kind="category" value={category} size="sm" />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          items={[
            { value: "all", label: "Toutes sévérités" },
            ...AUDIT_SEVERITIES.map((severity) => ({
              value: severity,
              label: AUDIT_SEVERITY_LABELS[severity],
            })),
          ]}
          value={params.severity ?? "all"}
          onValueChange={(value) => {
            if (!value || value === "all") {
              navigate({ severity: undefined });
              return;
            }
            navigate({ severity: value as AuditSeverityValue });
          }}
        >
          <SelectTrigger className="min-w-36 rounded-sm">
            {params.severity ? (
              <AuditMetaBadge kind="severity" value={params.severity} size="sm" />
            ) : (
              <SelectValue />
            )}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes sévérités</SelectItem>
            {AUDIT_SEVERITIES.map((severity) => (
              <SelectItem key={severity} value={severity}>
                <AuditMetaBadge kind="severity" value={severity} size="sm" />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          items={[
            { value: "all", label: "Tous appareils" },
            ...AUDIT_DEVICE_TYPES.map((deviceType) => ({
              value: deviceType,
              label: DEVICE_LABELS[deviceType],
            })),
          ]}
          value={params.deviceType ?? "all"}
          onValueChange={(value) => {
            if (!value || value === "all") {
              navigate({ deviceType: undefined });
              return;
            }
            navigate({
              deviceType: value as (typeof AUDIT_DEVICE_TYPES)[number],
            });
          }}
        >
          <SelectTrigger className="min-w-36 rounded-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous appareils</SelectItem>
            {AUDIT_DEVICE_TYPES.map((deviceType) => (
              <SelectItem key={deviceType} value={deviceType}>
                {DEVICE_LABELS[deviceType]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DatePickerField
          value={params.dateFrom ?? ""}
          onChange={(value) =>
            navigate({
              dateFrom: value || undefined,
              dateTo: params.dateTo
                ? resolveEndDateAfterStartChange(value, params.dateTo)
                : undefined,
            })
          }
          maxDate={params.dateTo}
          placeholder="Date de début"
          className="w-40"
          aria-label="Date de début"
        />

        <DatePickerField
          value={params.dateTo ?? ""}
          onChange={(value) => navigate({ dateTo: value || undefined })}
          minDate={params.dateFrom}
          placeholder="Date de fin"
          className="w-40"
          aria-label="Date de fin"
        />

        {isPending ? (
          <span className="text-xs font-medium text-muted">Mise à jour…</span>
        ) : null}
      </div>
    </div>
  );
}
