import {
  AUDIT_CATEGORIES,
  AUDIT_DEVICE_TYPES,
  AUDIT_SEVERITIES,
  BACKOFFICE_AUDIT_PAGE_SIZES,
  DEFAULT_BACKOFFICE_AUDIT_PAGE_SIZE,
  type AuditCategoryValue,
  type AuditSeverityValue,
} from "@/lib/constants/audit";

function raw(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

function parsePage(value: string | undefined): number {
  return Math.max(1, Number.parseInt(value ?? "1", 10) || 1);
}

function parseLimit(
  value: string | undefined,
  allowed: readonly number[],
  fallback: number,
): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return allowed.includes(parsed) ? parsed : fallback;
}

function parseCategory(value: string | undefined): AuditCategoryValue | undefined {
  if (!value) return undefined;
  return (AUDIT_CATEGORIES as readonly string[]).includes(value)
    ? (value as AuditCategoryValue)
    : undefined;
}

function parseSeverity(value: string | undefined): AuditSeverityValue | undefined {
  if (!value) return undefined;
  return (AUDIT_SEVERITIES as readonly string[]).includes(value)
    ? (value as AuditSeverityValue)
    : undefined;
}

function parseDeviceType(
  value: string | undefined,
): (typeof AUDIT_DEVICE_TYPES)[number] | undefined {
  if (!value) return undefined;
  return (AUDIT_DEVICE_TYPES as readonly string[]).includes(value)
    ? (value as (typeof AUDIT_DEVICE_TYPES)[number])
    : undefined;
}

export type BackofficeAuditListParams = {
  q: string;
  category?: AuditCategoryValue;
  severity?: AuditSeverityValue;
  deviceType?: (typeof AUDIT_DEVICE_TYPES)[number];
  dateFrom?: string;
  dateTo?: string;
  page: number;
  limit: number;
};

export function parseBackofficeAuditListParams(
  searchParams: Record<string, string | string[] | undefined>,
): BackofficeAuditListParams {
  const dateFrom = (raw(searchParams, "dateFrom") ?? "").trim() || undefined;
  const dateTo = (raw(searchParams, "dateTo") ?? "").trim() || undefined;

  return {
    q: (raw(searchParams, "q") ?? "").trim(),
    category: parseCategory(raw(searchParams, "category")),
    severity: parseSeverity(raw(searchParams, "severity")),
    deviceType: parseDeviceType(raw(searchParams, "deviceType")),
    dateFrom,
    dateTo,
    page: parsePage(raw(searchParams, "page")),
    limit: parseLimit(
      raw(searchParams, "limit"),
      BACKOFFICE_AUDIT_PAGE_SIZES,
      DEFAULT_BACKOFFICE_AUDIT_PAGE_SIZE,
    ),
  };
}

export function buildBackofficeAuditListQuery(
  params: Partial<BackofficeAuditListParams>,
): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.category) sp.set("category", params.category);
  if (params.severity) sp.set("severity", params.severity);
  if (params.deviceType) sp.set("deviceType", params.deviceType);
  if (params.dateFrom) sp.set("dateFrom", params.dateFrom);
  if (params.dateTo) sp.set("dateTo", params.dateTo);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  if (params.limit && params.limit !== DEFAULT_BACKOFFICE_AUDIT_PAGE_SIZE) {
    sp.set("limit", String(params.limit));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}
