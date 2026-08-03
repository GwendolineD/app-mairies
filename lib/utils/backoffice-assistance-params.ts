import { STAFF_REVIEW_STATUS_LABELS } from "@/lib/constants/staff-review-status";
import type { SupportRequestStatus } from "@/lib/types";
import { isSortMode, type SortMode } from "@/lib/utils/search-params";

export const DEFAULT_ASSISTANCE_STATUSES: SupportRequestStatus[] = [
  "new",
  "in_progress",
];

export const BACKOFFICE_ASSISTANCE_PAGE_SIZE = 25;

export const ASSISTANCE_STATUS_FILTERS = (
  Object.entries(STAFF_REVIEW_STATUS_LABELS) as [
    SupportRequestStatus,
    (typeof STAFF_REVIEW_STATUS_LABELS)[SupportRequestStatus],
  ][]
).map(([key, meta]) => ({
  key,
  label: meta.label,
}));

const STATUS_FILTER_SET = new Set<string>(
  ASSISTANCE_STATUS_FILTERS.map((item) => item.key),
);

export type BackofficeAssistanceListParams = {
  statuses: SupportRequestStatus[];
  commune?: string;
  q: string;
  tri: SortMode;
  page: number;
  limit: number;
};

function raw(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

function parseCsvParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
): string[] {
  const rawValue = searchParams[key];
  if (!rawValue) return [];
  const values = Array.isArray(rawValue) ? rawValue : [rawValue];
  const collected = new Set<string>();
  for (const item of values) {
    for (const piece of item.split(",")) {
      const trimmed = piece.trim();
      if (trimmed) collected.add(trimmed);
    }
  }
  return Array.from(collected);
}

function parsePage(value: string | undefined): number {
  return Math.max(1, Number.parseInt(value ?? "1", 10) || 1);
}

export function isSupportRequestStatus(
  value: string,
): value is SupportRequestStatus {
  return STATUS_FILTER_SET.has(value);
}

function sameStatusSet(
  a: SupportRequestStatus[],
  b: SupportRequestStatus[],
): boolean {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  return b.every((status) => setA.has(status));
}

function statusesDifferFromDefault(
  statuses: SupportRequestStatus[],
): boolean {
  if (statuses.length === 0) return true;
  return !sameStatusSet(statuses, DEFAULT_ASSISTANCE_STATUSES);
}

export function parseBackofficeAssistanceListParams(
  searchParams: Record<string, string | string[] | undefined>,
): BackofficeAssistanceListParams {
  const triRaw = raw(searchParams, "tri");
  const hasStatutParam = searchParams.statut !== undefined;
  const statutValues = parseCsvParam(searchParams, "statut");

  let statuses: SupportRequestStatus[];
  if (!hasStatutParam) {
    statuses = [...DEFAULT_ASSISTANCE_STATUSES];
  } else if (statutValues.includes("all") || statutValues.length === 0) {
    statuses = [];
  } else {
    statuses = statutValues.filter(isSupportRequestStatus);
  }

  const commune = (raw(searchParams, "commune") ?? "").trim() || undefined;

  return {
    statuses,
    commune,
    q: (raw(searchParams, "q") ?? "").trim(),
    tri: isSortMode(triRaw) ? triRaw : "recent",
    page: parsePage(raw(searchParams, "page")),
    limit: BACKOFFICE_ASSISTANCE_PAGE_SIZE,
  };
}

export function buildBackofficeAssistanceListQuery(
  params: Partial<BackofficeAssistanceListParams>,
): string {
  const sp = new URLSearchParams();
  const tri = params.tri ?? "recent";
  const statuses = params.statuses ?? [...DEFAULT_ASSISTANCE_STATUSES];
  const q = params.q?.trim() ?? "";

  sp.set("tri", tri);

  if (statuses.length === 0) {
    sp.set("statut", "all");
  } else {
    sp.set("statut", statuses.join(","));
  }

  if (params.commune) {
    sp.set("commune", params.commune);
  }

  if (q) {
    sp.set("q", q);
  }

  if (params.page && params.page > 1) {
    sp.set("page", String(params.page));
  }

  return `?${sp.toString()}`;
}

export function isBackofficeAssistanceUrlCanonical(
  searchParams: Record<string, string | string[] | undefined>,
): boolean {
  return (
    searchParams.tri !== undefined && searchParams.statut !== undefined
  );
}

export function activeBackofficeAssistanceFilterCount(
  params: BackofficeAssistanceListParams,
): number {
  let count = 0;

  if (statusesDifferFromDefault(params.statuses)) {
    count += 1;
  }
  if (params.commune) {
    count += 1;
  }
  if (params.tri !== "recent") {
    count += 1;
  }

  return count;
}

export function hasActiveAssistanceFilters(
  params: BackofficeAssistanceListParams,
): boolean {
  return activeBackofficeAssistanceFilterCount(params) > 0 || params.q.length > 0;
}

export function buildClearAssistanceFiltersQuery(): string {
  return buildBackofficeAssistanceListQuery({
    statuses: [...DEFAULT_ASSISTANCE_STATUSES],
    commune: undefined,
    q: "",
    tri: "recent",
    page: 1,
    limit: BACKOFFICE_ASSISTANCE_PAGE_SIZE,
  });
}
