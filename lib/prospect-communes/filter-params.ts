import {
  getPopulationBucketById,
  POPULATION_BUCKETS,
} from "@/lib/prospect-communes/population-buckets";
import {
  OPENING_DAY_OPTIONS,
  PROSPECT_DEPARTEMENT_OPTIONS,
  type OpeningDay,
} from "@/lib/prospect-communes/types";
import {
  isProspectOutreachStatus,
  type ProspectOutreachStatus,
} from "@/lib/prospect-outreach/types";

export type ProspectCommuneView = "list" | "map";

export type ProspectBbox = {
  south: number;
  west: number;
  north: number;
  east: number;
};

/** Exact YYYY-MM-DD date or sentinel for communes without a visit date. */
export type VisitDateParam = `${number}-${number}-${number}` | "none";

export type ProspectCommunesListParams = {
  q: string;
  maire: string;
  populationBuckets: string[];
  popMin?: number;
  popMax?: number;
  cp: string;
  openingDays: OpeningDay[];
  departments: string[];
  distMin?: number;
  distMax?: number;
  visitDate?: VisitDateParam;
  councilDate?: string;
  bbox?: ProspectBbox;
  view: ProspectCommuneView;
  detailId?: string;
  outreachStatuses: ProspectOutreachStatus[];
};

const VALID_POP_IDS = new Set(POPULATION_BUCKETS.map((bucket) => bucket.id));
const VALID_DAYS = new Set<string>(OPENING_DAY_OPTIONS);
const VALID_DEPTS = new Set<string>(PROSPECT_DEPARTEMENT_OPTIONS);

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

function parseOptionalInt(value: string | undefined): number | undefined {
  if (!value?.trim()) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseOptionalFloat(value: string | undefined): number | undefined {
  if (!value?.trim()) return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseDateParam(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || !YMD_RE.test(trimmed)) return undefined;
  return trimmed;
}

export function parseVisitDateParam(value: string | undefined): VisitDateParam | undefined {
  const trimmed = value?.trim();
  if (trimmed === "none") return "none";
  const date = parseDateParam(trimmed);
  return date as VisitDateParam | undefined;
}

function roundCoord(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

/** Parse bbox=south,west,north,east with basic validation for metropolitan France. */
export function parseBboxParam(value: string | undefined): ProspectBbox | undefined {
  if (!value?.trim()) return undefined;
  const parts = value.split(",").map((part) => Number.parseFloat(part.trim()));
  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) {
    return undefined;
  }

  const [south, west, north, east] = parts.map(roundCoord);
  if (south > north) return undefined;
  if (west > east) return undefined;
  if (south < 41 || north > 51.5 || west < -5.5 || east > 10) return undefined;

  return { south, west, north, east };
}

export function formatBboxParam(bbox: ProspectBbox): string {
  return [bbox.south, bbox.west, bbox.north, bbox.east]
    .map((value) => roundCoord(value).toFixed(4))
    .join(",");
}

export function parseProspectCommunesParams(
  searchParams: Record<string, string | string[] | undefined>,
): ProspectCommunesListParams {
  const populationBuckets: string[] = [];
  const seenPop = new Set<string>();
  for (const value of rawAll(searchParams, "pop")) {
    if (!VALID_POP_IDS.has(value) || seenPop.has(value)) continue;
    seenPop.add(value);
    populationBuckets.push(value);
  }

  const openingDays: OpeningDay[] = [];
  const seenDays = new Set<string>();
  for (const value of rawAll(searchParams, "jour")) {
    if (!VALID_DAYS.has(value) || seenDays.has(value)) continue;
    seenDays.add(value);
    openingDays.push(value as OpeningDay);
  }

  const departments: string[] = [];
  const seenDepts = new Set<string>();
  for (const value of rawAll(searchParams, "dept")) {
    if (!VALID_DEPTS.has(value) || seenDepts.has(value)) continue;
    seenDepts.add(value);
    departments.push(value);
  }

  const viewRaw = raw(searchParams, "view");
  const view: ProspectCommuneView = viewRaw === "map" ? "map" : "list";

  const detailRaw = raw(searchParams, "detail");

  const outreachStatuses: ProspectOutreachStatus[] = [];
  const seenStatuses = new Set<string>();
  for (const value of rawAll(searchParams, "statut")) {
    if (!isProspectOutreachStatus(value) || seenStatuses.has(value)) continue;
    seenStatuses.add(value);
    outreachStatuses.push(value);
  }

  return {
    q: raw(searchParams, "q")?.trim() ?? "",
    maire: raw(searchParams, "maire")?.trim() ?? "",
    populationBuckets,
    popMin: parseOptionalInt(raw(searchParams, "popMin")),
    popMax: parseOptionalInt(raw(searchParams, "popMax")),
    cp: raw(searchParams, "cp")?.trim() ?? "",
    openingDays,
    departments,
    distMin: parseOptionalFloat(raw(searchParams, "distMin")),
    distMax: parseOptionalFloat(raw(searchParams, "distMax")),
    visitDate: parseVisitDateParam(raw(searchParams, "visite")),
    councilDate: parseDateParam(raw(searchParams, "conseil")),
    bbox: parseBboxParam(raw(searchParams, "bbox")),
    view,
    detailId: detailRaw?.trim() || undefined,
    outreachStatuses,
  };
}

export function buildProspectCommunesQuery(
  params: ProspectCommunesListParams,
): string {
  const query = new URLSearchParams();

  if (params.q) query.set("q", params.q);
  if (params.maire) query.set("maire", params.maire);
  for (const bucket of params.populationBuckets) query.append("pop", bucket);
  if (params.popMin !== undefined) query.set("popMin", String(params.popMin));
  if (params.popMax !== undefined) query.set("popMax", String(params.popMax));
  if (params.cp) query.set("cp", params.cp);
  for (const day of params.openingDays) query.append("jour", day);
  for (const dept of params.departments) query.append("dept", dept);
  if (params.distMin !== undefined) query.set("distMin", String(params.distMin));
  if (params.distMax !== undefined) query.set("distMax", String(params.distMax));
  if (params.visitDate) query.set("visite", params.visitDate);
  if (params.councilDate) query.set("conseil", params.councilDate);
  if (params.bbox) query.set("bbox", formatBboxParam(params.bbox));
  if (params.view !== "list") query.set("view", params.view);
  if (params.detailId) query.set("detail", params.detailId);
  for (const status of params.outreachStatuses) query.append("statut", status);

  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export function activeProspectCommunesFilterCount(
  params: ProspectCommunesListParams,
): number {
  let count = 0;
  if (params.q) count += 1;
  if (params.maire) count += 1;
  if (params.populationBuckets.length > 0) count += 1;
  if (params.popMin !== undefined || params.popMax !== undefined) count += 1;
  if (params.cp) count += 1;
  if (params.openingDays.length > 0) count += 1;
  if (params.departments.length > 0) count += 1;
  if (params.distMin !== undefined || params.distMax !== undefined) count += 1;
  if (params.visitDate) count += 1;
  if (params.councilDate) count += 1;
  if (params.bbox) count += 1;
  if (params.outreachStatuses.length > 0) count += 1;
  return count;
}

export function mergeProspectCommunesParams(
  current: ProspectCommunesListParams,
  patch: Partial<ProspectCommunesListParams>,
): ProspectCommunesListParams {
  return { ...current, ...patch };
}

export function clearProspectCommunesFilters(
  current: ProspectCommunesListParams,
): ProspectCommunesListParams {
  return {
    q: "",
    maire: "",
    populationBuckets: [],
    popMin: undefined,
    popMax: undefined,
    cp: "",
    openingDays: [],
    departments: [],
    distMin: undefined,
    distMax: undefined,
    visitDate: undefined,
    councilDate: undefined,
    bbox: undefined,
    view: current.view,
    detailId: undefined,
    outreachStatuses: [],
  };
}

/** Used in tests to mirror SQL population filter semantics. */
export function matchesPopulationFilter(
  population: number,
  buckets: string[],
  popMin?: number,
  popMax?: number,
): boolean {
  if (buckets.length > 0) {
    const bucketMatch = buckets.some((id) => {
      const bucket = getPopulationBucketById(id);
      if (!bucket) return false;
      return population >= bucket.min && population <= bucket.max;
    });
    if (!bucketMatch) return false;
  }

  if (popMin !== undefined && population < popMin) return false;
  if (popMax !== undefined && population > popMax) return false;

  return true;
}
