import { isSortMode, type SortMode } from "@/lib/utils/search-params";

export type ReportStatusFilter =
  | "pending"
  | "content_suspended"
  | "user_suspended"
  | "dismissed";

export type ReportContentFilter = "demande" | "offre" | "initiative" | "event";

export type ReportListParams = {
  tri: SortMode;
  /** Empty array = all statuses. Default when param absent: pending only. */
  statuses: ReportStatusFilter[];
  contentTypes: ReportContentFilter[];
  /** Title search (URL param `q`). */
  q: string;
};

export const REPORT_STATUS_FILTERS = [
  { key: "pending" as const, label: "En attente" },
  { key: "content_suspended" as const, label: "Contenu suspendu" },
  { key: "user_suspended" as const, label: "Auteur suspendu" },
  { key: "dismissed" as const, label: "Ignoré" },
];

export const REPORT_CONTENT_FILTERS = [
  { key: "demande" as const, label: "Demande" },
  { key: "offre" as const, label: "Offre" },
  { key: "initiative" as const, label: "Initiative" },
  { key: "event" as const, label: "Événement" },
];

const DEFAULT_STATUSES: ReportStatusFilter[] = ["pending"];

const STATUS_FILTER_SET = new Set<string>(
  REPORT_STATUS_FILTERS.map((item) => item.key),
);
const CONTENT_FILTER_SET = new Set<string>(
  REPORT_CONTENT_FILTERS.map((item) => item.key),
);

export function isReportStatusFilter(
  value: string,
): value is ReportStatusFilter {
  return STATUS_FILTER_SET.has(value);
}

export function isReportContentFilter(
  value: string,
): value is ReportContentFilter {
  return CONTENT_FILTER_SET.has(value);
}

function parseCsvParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
): string[] {
  const raw = searchParams[key];
  if (!raw) return [];
  const values = Array.isArray(raw) ? raw : [raw];
  const collected = new Set<string>();
  for (const item of values) {
    for (const piece of item.split(",")) {
      const trimmed = piece.trim();
      if (trimmed) collected.add(trimmed);
    }
  }
  return Array.from(collected);
}

export function parseReportListParams(
  searchParams: Record<string, string | string[] | undefined>,
): ReportListParams {
  const triRaw = Array.isArray(searchParams.tri)
    ? searchParams.tri[0]
    : searchParams.tri;

  const hasStatutParam = searchParams.statut !== undefined;
  const statutValues = parseCsvParam(searchParams, "statut");

  let statuses: ReportStatusFilter[];
  if (!hasStatutParam) {
    statuses = [...DEFAULT_STATUSES];
  } else if (statutValues.includes("all") || statutValues.length === 0) {
    statuses = [];
  } else {
    statuses = statutValues.filter(isReportStatusFilter);
  }

  const contentTypes = parseCsvParam(searchParams, "contenu").filter(
    isReportContentFilter,
  );

  const qRaw = Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q;

  return {
    tri: isSortMode(triRaw) ? triRaw : "recent",
    statuses,
    contentTypes,
    q: (qRaw ?? "").trim(),
  };
}

export function buildReportListQuery(
  params: Partial<ReportListParams>,
): string {
  const sp = new URLSearchParams();
  const tri = params.tri ?? "recent";
  const statuses = params.statuses ?? [...DEFAULT_STATUSES];
  const contentTypes = params.contentTypes ?? [];
  const q = params.q?.trim() ?? "";

  sp.set("tri", tri);

  if (statuses.length === 0) {
    sp.set("statut", "all");
  } else {
    sp.set("statut", statuses.join(","));
  }

  if (contentTypes.length > 0) {
    sp.set("contenu", contentTypes.join(","));
  }

  if (q) {
    sp.set("q", q);
  }

  return `?${sp.toString()}`;
}

export function isReportListUrlCanonical(
  searchParams: Record<string, string | string[] | undefined>,
): boolean {
  return (
    searchParams.tri !== undefined && searchParams.statut !== undefined
  );
}

export function activeReportFilterCount(params: ReportListParams): number {
  let count = 0;

  if (params.statuses.length === 0) {
    count += 1;
  } else if (
    params.statuses.length !== 1 ||
    params.statuses[0] !== "pending"
  ) {
    count += params.statuses.length;
  }

  count += params.contentTypes.length;
  return count;
}

export function hasActiveReportFilters(params: ReportListParams): boolean {
  return activeReportFilterCount(params) > 0 || params.q.length > 0;
}

export function matchesReportSearchFilter(
  report: ReportRow,
  query: string,
  titleMap: Record<string, string>,
): boolean {
  const trimmed = query.trim();
  if (!trimmed) return true;

  const title = titleMap[report.context_id];
  if (!title) return false;

  return title.toLowerCase().includes(trimmed.toLowerCase());
}

type ReportRow = {
  status: string;
  resolution: string | null;
  context_type: string;
  context_id: string;
};

export function matchesReportStatusFilter(
  report: ReportRow,
  statuses: ReportStatusFilter[],
): boolean {
  if (statuses.length === 0) return true;

  return statuses.some((status) => {
    if (status === "pending") return report.status === "pending";
    return report.resolution === status;
  });
}

export function matchesReportContentFilter(
  report: ReportRow,
  contentTypes: ReportContentFilter[],
  announcementTypeMap: Record<string, string>,
): boolean {
  if (contentTypes.length === 0) return true;

  return contentTypes.some((filter) => {
    if (filter === "initiative") return report.context_type === "initiative";
    if (filter === "event") return report.context_type === "event";
    if (filter === "demande") {
      return (
        report.context_type === "announcement" &&
        announcementTypeMap[report.context_id] === "demande"
      );
    }
    if (filter === "offre") {
      return (
        report.context_type === "announcement" &&
        announcementTypeMap[report.context_id] === "offre"
      );
    }
    return false;
  });
}

export function filterReports<T extends ReportRow>(
  reports: T[],
  params: ReportListParams,
  announcementTypeMap: Record<string, string>,
  titleMap: Record<string, string>,
): T[] {
  return reports.filter(
    (report) =>
      matchesReportStatusFilter(report, params.statuses) &&
      matchesReportContentFilter(
        report,
        params.contentTypes,
        announcementTypeMap,
      ) &&
      matchesReportSearchFilter(report, params.q, titleMap),
  );
}
