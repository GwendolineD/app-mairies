import type { AnnouncementType } from "@/lib/constants/announcement-types";
import { isAnnouncementType } from "@/lib/constants/announcement-types";
import { ANNOUNCEMENT_CATEGORY_SLUGS } from "@/lib/constants/announcement-categories";

export type ListViewMode = "liste" | "carte";
export type CreateModalKind = "annonce" | "initiative";
export type SortMode = "recent" | "oldest";

export function isSortMode(value: string | undefined): value is SortMode {
  return value === "recent" || value === "oldest";
}

export const ANNOUNCEMENT_DATE_FILTERS = [
  "today",
  "next7days",
  "none",
  "custom",
] as const;
export type AnnouncementDateFilter = (typeof ANNOUNCEMENT_DATE_FILTERS)[number];

export function isAnnouncementDateFilter(
  value: string | undefined,
): value is AnnouncementDateFilter {
  return (
    !!value &&
    (ANNOUNCEMENT_DATE_FILTERS as readonly string[]).includes(value)
  );
}

export type AnnouncementListParams = {
  vue: ListViewMode;
  type?: AnnouncementType;
  /** Multi-select category filter (URL: `cat=bricolage,numerique`). */
  categories: string[];
  date?: AnnouncementDateFilter;
  /** ISO date YYYY-MM-DD when `date` === "custom". */
  dateValue?: string;
  tri: SortMode;
  page: number;
  create?: CreateModalKind;
  createType?: AnnouncementType;
};

const DEFAULT_VIEW: ListViewMode = "liste";
const ALLOWED_CATEGORIES = new Set<string>(ANNOUNCEMENT_CATEGORY_SLUGS);

export function parseListView(value: string | undefined): ListViewMode {
  return value === "carte" ? "carte" : DEFAULT_VIEW;
}

function parseCategories(
  searchParams: Record<string, string | string[] | undefined>,
): string[] {
  const collected = new Set<string>();

  // Support both `?cat=a&cat=b` and `?cat=a,b`. Legacy `?categorie=` is also accepted.
  const sources: (string | string[] | undefined)[] = [
    searchParams.cat,
    searchParams.categorie,
  ];

  for (const source of sources) {
    if (!source) continue;
    const arr = Array.isArray(source) ? source : [source];
    for (const item of arr) {
      for (const piece of item.split(",")) {
        const slug = piece.trim();
        if (slug && ALLOWED_CATEGORIES.has(slug)) collected.add(slug);
      }
    }
  }

  return Array.from(collected);
}

function isIsoDate(value: string | undefined): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function parseAnnouncementListParams(
  searchParams: Record<string, string | string[] | undefined>,
): AnnouncementListParams {
  const raw = (key: string) => {
    const v = searchParams[key];
    return Array.isArray(v) ? v[0] : v;
  };

  const typeRaw = raw("type");
  const createTypeRaw = raw("createType");
  const createRaw = raw("create");
  const dateRaw = raw("date");
  const dateValueRaw = raw("dateValue");
  const triRaw = raw("tri");
  const date = isAnnouncementDateFilter(dateRaw) ? dateRaw : undefined;

  return {
    vue: parseListView(raw("vue")),
    type: isAnnouncementType(typeRaw ?? "")
      ? (typeRaw as AnnouncementType)
      : undefined,
    categories: parseCategories(searchParams),
    date,
    dateValue:
      date === "custom" && isIsoDate(dateValueRaw) ? dateValueRaw : undefined,
    tri: isSortMode(triRaw) ? triRaw : "recent",
    page: Math.max(1, Number.parseInt(raw("page") ?? "1", 10) || 1),
    create:
      createRaw === "annonce" || createRaw === "initiative"
        ? createRaw
        : undefined,
    createType: isAnnouncementType(createTypeRaw ?? "")
      ? (createTypeRaw as AnnouncementType)
      : undefined,
  };
}

export function buildAnnouncementListQuery(
  params: Partial<AnnouncementListParams>,
): string {
  const sp = new URLSearchParams();
  if (params.vue && params.vue !== DEFAULT_VIEW) sp.set("vue", params.vue);
  if (params.type) sp.set("type", params.type);
  if (params.categories && params.categories.length > 0) {
    sp.set("cat", params.categories.join(","));
  }
  if (params.date) {
    sp.set("date", params.date);
    if (params.date === "custom" && params.dateValue) {
      sp.set("dateValue", params.dateValue);
    }
  }
  if (params.tri && params.tri !== "recent") sp.set("tri", params.tri);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  if (params.create) sp.set("create", params.create);
  if (params.createType) sp.set("createType", params.createType);
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export function hasActiveAnnouncementFilters(
  params: Pick<AnnouncementListParams, "type" | "categories" | "date">,
): boolean {
  return !!(params.type || params.categories.length > 0 || params.date);
}

export type InitiativeListParams = {
  vue: ListViewMode;
  categorie?: string;
  tri: SortMode;
  page: number;
  create?: CreateModalKind;
};

export function parseInitiativeListParams(
  searchParams: Record<string, string | string[] | undefined>,
): InitiativeListParams {
  const raw = (key: string) => {
    const v = searchParams[key];
    return Array.isArray(v) ? v[0] : v;
  };
  const createRaw = raw("create");
  return {
    vue: parseListView(raw("vue")),
    categorie: raw("categorie") || undefined,
    tri: "recent",
    page: Math.max(1, Number.parseInt(raw("page") ?? "1", 10) || 1),
    create:
      createRaw === "annonce" || createRaw === "initiative"
        ? createRaw
        : undefined,
  };
}

export function buildInitiativeListQuery(
  params: Partial<InitiativeListParams>,
): string {
  const sp = new URLSearchParams();
  if (params.vue && params.vue !== DEFAULT_VIEW) sp.set("vue", params.vue);
  if (params.categorie) sp.set("categorie", params.categorie);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  if (params.create) sp.set("create", params.create);
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export type EventListParams = {
  vue: ListViewMode;
  tri: SortMode;
  page: number;
};

export function parseEventListParams(
  searchParams: Record<string, string | string[] | undefined>,
): EventListParams {
  const raw = (key: string) => {
    const v = searchParams[key];
    return Array.isArray(v) ? v[0] : v;
  };
  return {
    vue: parseListView(raw("vue")),
    tri: "recent",
    page: Math.max(1, Number.parseInt(raw("page") ?? "1", 10) || 1),
  };
}

export function buildEventListQuery(params: Partial<EventListParams>): string {
  const sp = new URLSearchParams();
  if (params.vue && params.vue !== DEFAULT_VIEW) sp.set("vue", params.vue);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}
