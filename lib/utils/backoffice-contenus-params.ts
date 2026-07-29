import {
  ANNOUNCEMENT_STATUS,
  INITIATIVE_STATUS,
} from "@/lib/constants/statuses";

export const BACKOFFICE_CONTENT_TYPES = [
  "announcement",
  "initiative",
  "event",
] as const;

export type BackofficeContentType =
  (typeof BACKOFFICE_CONTENT_TYPES)[number];

export const BACKOFFICE_CONTENT_TYPE_LABELS: Record<
  BackofficeContentType,
  string
> = {
  announcement: "Annonce",
  initiative: "Initiative",
  event: "Événement",
};

export const BACKOFFICE_CONTENT_STATUSES = [
  ANNOUNCEMENT_STATUS.ouverte,
  ANNOUNCEMENT_STATUS.pourvue,
  ANNOUNCEMENT_STATUS.archivee,
  ANNOUNCEMENT_STATUS.expiree,
  INITIATIVE_STATUS.active,
  INITIATIVE_STATUS.archived,
] as const;

export type BackofficeContentStatus =
  (typeof BACKOFFICE_CONTENT_STATUSES)[number];

export const BACKOFFICE_CONTENT_STATUS_LABELS: Record<
  BackofficeContentStatus,
  string
> = {
  [ANNOUNCEMENT_STATUS.ouverte]: "Ouverte",
  [ANNOUNCEMENT_STATUS.pourvue]: "Pourvue",
  [ANNOUNCEMENT_STATUS.archivee]: "Archivée",
  [ANNOUNCEMENT_STATUS.expiree]: "Expirée",
  [INITIATIVE_STATUS.active]: "Active",
  [INITIATIVE_STATUS.archived]: "Archivée",
};

export const BACKOFFICE_CONTENT_SORT = {
  newest: "newest",
  oldest: "oldest",
} as const;

export type BackofficeContentSort =
  (typeof BACKOFFICE_CONTENT_SORT)[keyof typeof BACKOFFICE_CONTENT_SORT];

export const BACKOFFICE_CONTENT_SUBTYPES = ["demande", "offre"] as const;

export type BackofficeContentSubtype =
  (typeof BACKOFFICE_CONTENT_SUBTYPES)[number];

export const BACKOFFICE_CONTENUS_PAGE_SIZES = [10, 25, 50] as const;
export const DEFAULT_BACKOFFICE_CONTENUS_PAGE_SIZE = 25;

const DEFAULT_CONTENT_TYPES: BackofficeContentType[] = ["announcement"];

function raw(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

function rawAll(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
): string[] {
  const value = searchParams[key];
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
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

function parseContentTypes(
  searchParams: Record<string, string | string[] | undefined>,
): BackofficeContentType[] {
  const seen = new Set<BackofficeContentType>();
  const types: BackofficeContentType[] = [];

  for (const rawValue of rawAll(searchParams, "type")) {
    if (!(BACKOFFICE_CONTENT_TYPES as readonly string[]).includes(rawValue)) {
      continue;
    }
    const type = rawValue as BackofficeContentType;
    if (seen.has(type)) continue;
    seen.add(type);
    types.push(type);
  }

  return types.length > 0 ? types : [...DEFAULT_CONTENT_TYPES];
}

function parseContentStatuses(
  searchParams: Record<string, string | string[] | undefined>,
): BackofficeContentStatus[] {
  const seen = new Set<BackofficeContentStatus>();
  const statuses: BackofficeContentStatus[] = [];

  for (const rawValue of rawAll(searchParams, "status")) {
    if (!(BACKOFFICE_CONTENT_STATUSES as readonly string[]).includes(rawValue)) {
      continue;
    }
    const status = rawValue as BackofficeContentStatus;
    if (seen.has(status)) continue;
    seen.add(status);
    statuses.push(status);
  }

  return statuses;
}

function parseBooleanFlag(value: string | undefined): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function parseSort(value: string | undefined): BackofficeContentSort {
  return value === BACKOFFICE_CONTENT_SORT.oldest
    ? BACKOFFICE_CONTENT_SORT.oldest
    : BACKOFFICE_CONTENT_SORT.newest;
}

function parseSubtype(
  value: string | undefined,
): BackofficeContentSubtype | undefined {
  if (!value) return undefined;
  return (BACKOFFICE_CONTENT_SUBTYPES as readonly string[]).includes(value)
    ? (value as BackofficeContentSubtype)
    : undefined;
}

export type BackofficeContenusListParams = {
  q: string;
  types: BackofficeContentType[];
  commune?: string;
  statuses: BackofficeContentStatus[];
  suspended?: boolean;
  subtype?: BackofficeContentSubtype;
  category?: string;
  official?: boolean;
  dateFrom?: string;
  dateTo?: string;
  sort: BackofficeContentSort;
  page: number;
  limit: number;
};

export function parseBackofficeContenusListParams(
  searchParams: Record<string, string | string[] | undefined>,
): BackofficeContenusListParams {
  const dateFrom = (raw(searchParams, "dateFrom") ?? "").trim() || undefined;
  const dateTo = (raw(searchParams, "dateTo") ?? "").trim() || undefined;
  const commune = (raw(searchParams, "commune") ?? "").trim() || undefined;
  const category = (raw(searchParams, "category") ?? "").trim() || undefined;

  return {
    q: (raw(searchParams, "q") ?? "").trim(),
    types: parseContentTypes(searchParams),
    commune,
    statuses: parseContentStatuses(searchParams),
    suspended: parseBooleanFlag(raw(searchParams, "suspended")),
    subtype: parseSubtype(raw(searchParams, "subtype")),
    category,
    official: parseBooleanFlag(raw(searchParams, "official")),
    dateFrom,
    dateTo,
    sort: parseSort(raw(searchParams, "sort")),
    page: parsePage(raw(searchParams, "page")),
    limit: parseLimit(
      raw(searchParams, "limit"),
      BACKOFFICE_CONTENUS_PAGE_SIZES,
      DEFAULT_BACKOFFICE_CONTENUS_PAGE_SIZE,
    ),
  };
}

export function buildBackofficeContenusListQuery(
  params: Partial<BackofficeContenusListParams>,
): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  for (const type of params.types ?? []) {
    sp.append("type", type);
  }
  if (params.commune) sp.set("commune", params.commune);
  for (const status of params.statuses ?? []) {
    sp.append("status", status);
  }
  if (params.suspended === true) sp.set("suspended", "true");
  if (params.suspended === false) sp.set("suspended", "false");
  if (params.subtype) sp.set("subtype", params.subtype);
  if (params.category) sp.set("category", params.category);
  if (params.official === true) sp.set("official", "true");
  if (params.official === false) sp.set("official", "false");
  if (params.dateFrom) sp.set("dateFrom", params.dateFrom);
  if (params.dateTo) sp.set("dateTo", params.dateTo);
  if (params.sort && params.sort !== BACKOFFICE_CONTENT_SORT.newest) {
    sp.set("sort", params.sort);
  }
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  if (params.limit && params.limit !== DEFAULT_BACKOFFICE_CONTENUS_PAGE_SIZE) {
    sp.set("limit", String(params.limit));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export function statusesForContentType(
  type: BackofficeContentType,
  selected: BackofficeContentStatus[],
): BackofficeContentStatus[] {
  const valid =
    type === "announcement"
      ? ([
          ANNOUNCEMENT_STATUS.ouverte,
          ANNOUNCEMENT_STATUS.pourvue,
          ANNOUNCEMENT_STATUS.archivee,
          ANNOUNCEMENT_STATUS.expiree,
        ] as BackofficeContentStatus[])
      : ([
          INITIATIVE_STATUS.active,
          INITIATIVE_STATUS.archived,
        ] as BackofficeContentStatus[]);

  if (selected.length === 0) return valid;
  return valid.filter((status) => selected.includes(status));
}

export function activeBackofficeContenusFilterCount(
  params: BackofficeContenusListParams,
): number {
  let count = 0;
  const defaultTypes: BackofficeContentType[] = ["announcement"];
  const typesMatch =
    params.types.length === defaultTypes.length &&
    params.types.every((t) => defaultTypes.includes(t));
  if (!typesMatch) count += 1;
  if (params.commune) count += 1;
  if (params.statuses.length > 0) count += 1;
  if (params.suspended != null) count += 1;
  if (params.subtype) count += 1;
  if (params.category) count += 1;
  if (params.official != null) count += 1;
  if (params.dateFrom) count += 1;
  if (params.dateTo) count += 1;
  if (params.sort !== BACKOFFICE_CONTENT_SORT.newest) count += 1;
  return count;
}
