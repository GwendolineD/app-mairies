import type { AnnouncementType } from "@/lib/constants/announcement-types";
import { isAnnouncementType } from "@/lib/constants/announcement-types";

export type ListViewMode = "liste" | "carte";
export type CreateModalKind = "annonce" | "initiative";
export type SortMode = "recent";

export type AnnouncementListParams = {
  vue: ListViewMode;
  type?: AnnouncementType;
  categorie?: string;
  tri: SortMode;
  page: number;
  create?: CreateModalKind;
  createType?: AnnouncementType;
};

const DEFAULT_VIEW: ListViewMode = "liste";

export function parseListView(value: string | undefined): ListViewMode {
  return value === "carte" ? "carte" : DEFAULT_VIEW;
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

  return {
    vue: parseListView(raw("vue")),
    type: isAnnouncementType(typeRaw ?? "") ? (typeRaw as AnnouncementType) : undefined,
    categorie: raw("categorie") || undefined,
    tri: "recent",
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
  if (params.categorie) sp.set("categorie", params.categorie);
  if (params.tri && params.tri !== "recent") sp.set("tri", params.tri);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  if (params.create) sp.set("create", params.create);
  if (params.createType) sp.set("createType", params.createType);
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
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
