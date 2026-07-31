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

export const DEFAULT_BACKOFFICE_CONTENT_TAB: BackofficeContentType =
  "announcement";

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

export const CONTENUS_FILTERS_STORAGE_PREFIX = "vl:contenus-filters:";

/** Filters persisted per tab (excludes tab, page, limit). */
export type BackofficeContenusStoredFilters = {
  q?: string;
  commune?: string;
  statuses?: BackofficeContentStatus[];
  suspended?: boolean;
  subtype?: BackofficeContentSubtype;
  category?: string;
  official?: boolean;
  dateFrom?: string;
  dateTo?: string;
  sort?: BackofficeContentSort;
};

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

function parseContentTab(
  searchParams: Record<string, string | string[] | undefined>,
): BackofficeContentType {
  const tabValue = raw(searchParams, "tab");
  if (
    tabValue &&
    (BACKOFFICE_CONTENT_TYPES as readonly string[]).includes(tabValue)
  ) {
    return tabValue as BackofficeContentType;
  }

  // Legacy fallback: first `type` param when `tab` is absent
  for (const legacyType of rawAll(searchParams, "type")) {
    if (
      (BACKOFFICE_CONTENT_TYPES as readonly string[]).includes(legacyType)
    ) {
      return legacyType as BackofficeContentType;
    }
  }

  return DEFAULT_BACKOFFICE_CONTENT_TAB;
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
  tab: BackofficeContentType;
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
  const tab = parseContentTab(searchParams);
  const dateFrom = (raw(searchParams, "dateFrom") ?? "").trim() || undefined;
  const dateTo = (raw(searchParams, "dateTo") ?? "").trim() || undefined;
  const commune = (raw(searchParams, "commune") ?? "").trim() || undefined;
  const category = (raw(searchParams, "category") ?? "").trim() || undefined;

  return {
    q: (raw(searchParams, "q") ?? "").trim(),
    tab,
    commune,
    statuses: parseContentStatuses(searchParams),
    suspended: parseBooleanFlag(raw(searchParams, "suspended")),
    subtype: tab === "announcement" ? parseSubtype(raw(searchParams, "subtype")) : undefined,
    category,
    official: tab === "event" ? parseBooleanFlag(raw(searchParams, "official")) : undefined,
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

export function extractStoredContenusFilters(
  params: BackofficeContenusListParams,
): BackofficeContenusStoredFilters {
  const stored: BackofficeContenusStoredFilters = {};

  if (params.q) stored.q = params.q;
  if (params.commune) stored.commune = params.commune;
  if (params.statuses.length > 0) stored.statuses = params.statuses;
  if (params.suspended != null) stored.suspended = params.suspended;
  if (params.subtype) stored.subtype = params.subtype;
  if (params.category) stored.category = params.category;
  if (params.official != null) stored.official = params.official;
  if (params.dateFrom) stored.dateFrom = params.dateFrom;
  if (params.dateTo) stored.dateTo = params.dateTo;
  if (params.sort !== BACKOFFICE_CONTENT_SORT.newest) {
    stored.sort = params.sort;
  }

  return stored;
}

export function storedFiltersToPartialParams(
  tab: BackofficeContentType,
  stored: BackofficeContenusStoredFilters,
): Partial<BackofficeContenusListParams> {
  return {
    tab,
    q: stored.q ?? "",
    commune: stored.commune,
    statuses: stored.statuses ?? [],
    suspended: stored.suspended,
    subtype: tab === "announcement" ? stored.subtype : undefined,
    category: stored.category,
    official: tab === "event" ? stored.official : undefined,
    dateFrom: stored.dateFrom,
    dateTo: stored.dateTo,
    sort: stored.sort ?? BACKOFFICE_CONTENT_SORT.newest,
    page: 1,
  };
}

export function contenusFiltersStorageKey(tab: BackofficeContentType): string {
  return `${CONTENUS_FILTERS_STORAGE_PREFIX}${tab}`;
}

export function saveContenusFiltersToStorage(
  tab: BackofficeContentType,
  params: BackofficeContenusListParams,
): void {
  if (typeof window === "undefined") return;
  try {
    const stored = extractStoredContenusFilters(params);
    window.localStorage.setItem(
      contenusFiltersStorageKey(tab),
      JSON.stringify(stored),
    );
  } catch {
    // Ignore quota or privacy mode errors
  }
}

export function loadContenusFiltersFromStorage(
  tab: BackofficeContentType,
): BackofficeContenusStoredFilters | null {
  if (typeof window === "undefined") return null;
  try {
    const rawValue = window.localStorage.getItem(contenusFiltersStorageKey(tab));
    if (!rawValue) return null;
    return JSON.parse(rawValue) as BackofficeContenusStoredFilters;
  } catch {
    return null;
  }
}

export function buildBackofficeContenusListQuery(
  params: Partial<BackofficeContenusListParams>,
): string {
  const sp = new URLSearchParams();
  const tab = params.tab ?? DEFAULT_BACKOFFICE_CONTENT_TAB;

  if (params.q) sp.set("q", params.q);
  if (tab !== DEFAULT_BACKOFFICE_CONTENT_TAB) {
    sp.set("tab", tab);
  }
  if (params.commune) sp.set("commune", params.commune);
  for (const status of params.statuses ?? []) {
    sp.append("status", status);
  }
  if (params.suspended === true) sp.set("suspended", "true");
  if (params.suspended === false) sp.set("suspended", "false");
  if (tab === "announcement" && params.subtype) {
    sp.set("subtype", params.subtype);
  }
  if (params.category) sp.set("category", params.category);
  if (tab === "event" && params.official === true) sp.set("official", "true");
  if (tab === "event" && params.official === false) sp.set("official", "false");
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
