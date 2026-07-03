import { TZDate } from "@date-fns/tz";
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";
import type { MembershipRole, MembershipStatus } from "@/lib/types";
import { MEMBERSHIP_ROLE_OPTIONS } from "@/lib/constants/roles";

export type HabitantsSort = "recent" | "name_asc" | "name_desc";

export type HabitantsInscriptionFilter = "semaine" | "mois" | "perso";

export type HabitantsListParams = {
  q: string;
  tri: HabitantsSort;
  statuses: MembershipStatus[];
  roles: MembershipRole[];
  inscription?: HabitantsInscriptionFilter;
  inscriptionDebut?: string;
  inscriptionFin?: string;
  page: number;
  limit: number;
};

export const HABITANTS_PAGE_SIZES = [25, 50, 100] as const;
export const DEFAULT_HABITANTS_PAGE_SIZE = 25;

export const HABITANTS_STATUS_FILTERS = [
  { key: "active" as const, label: "Actif·ve" },
  { key: "suspended" as const, label: "Suspendu·e" },
] as const;

export const HABITANTS_ROLE_FILTERS = MEMBERSHIP_ROLE_OPTIONS.map((role) => ({
  key: role,
  label:
    role === "member"
      ? "Habitant·e"
      : role === "staff"
        ? "Employé·e mairie"
        : "Maire",
}));

const TIMEZONE = "Europe/Paris";

const STATUS_FILTER_SET = new Set<string>(
  HABITANTS_STATUS_FILTERS.map((item) => item.key),
);
const ROLE_FILTER_SET = new Set<string>(
  HABITANTS_ROLE_FILTERS.map((item) => item.key),
);
const INSCRIPTION_FILTER_SET = new Set<string>(["semaine", "mois", "perso"]);

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
  const value = searchParams[key];
  if (!value) return [];
  const values = Array.isArray(value) ? value : [value];
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

function parseLimit(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return (HABITANTS_PAGE_SIZES as readonly number[]).includes(parsed)
    ? parsed
    : DEFAULT_HABITANTS_PAGE_SIZE;
}

function isHabitantsSort(value: string | undefined): value is HabitantsSort {
  return value === "recent" || value === "name_asc" || value === "name_desc";
}

function isHabitantsInscriptionFilter(
  value: string | undefined,
): value is HabitantsInscriptionFilter {
  return !!value && INSCRIPTION_FILTER_SET.has(value);
}

function isIsoDate(value: string | undefined): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parisNow(): TZDate {
  return new TZDate(new Date(), TIMEZONE);
}

export function parseHabitantsListParams(
  searchParams: Record<string, string | string[] | undefined>,
): HabitantsListParams {
  const triRaw = raw(searchParams, "tri");
  const inscriptionRaw = raw(searchParams, "inscription");
  const inscription = isHabitantsInscriptionFilter(inscriptionRaw)
    ? inscriptionRaw
    : undefined;
  const statuses = parseCsvParam(searchParams, "statut").filter(
    (value): value is MembershipStatus =>
      STATUS_FILTER_SET.has(value) && value !== "left",
  );
  const roles = parseCsvParam(searchParams, "role").filter(
    (value): value is MembershipRole => ROLE_FILTER_SET.has(value),
  );

  const debutRaw = (raw(searchParams, "inscriptionDebut") ?? "").trim();
  const finRaw = (raw(searchParams, "inscriptionFin") ?? "").trim();

  return {
    q: (raw(searchParams, "q") ?? "").trim(),
    tri: isHabitantsSort(triRaw) ? triRaw : "recent",
    statuses,
    roles,
    inscription,
    inscriptionDebut:
      inscription === "perso" && isIsoDate(debutRaw) ? debutRaw : undefined,
    inscriptionFin:
      inscription === "perso" && isIsoDate(finRaw) ? finRaw : undefined,
    page: parsePage(raw(searchParams, "page")),
    limit: parseLimit(raw(searchParams, "limit")),
  };
}

export function buildHabitantsListQuery(
  params: Partial<HabitantsListParams>,
): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.tri && params.tri !== "recent") sp.set("tri", params.tri);
  if (params.statuses && params.statuses.length > 0) {
    sp.set("statut", params.statuses.join(","));
  }
  if (params.roles && params.roles.length > 0) {
    sp.set("role", params.roles.join(","));
  }
  if (params.inscription) sp.set("inscription", params.inscription);
  if (params.inscription === "perso") {
    if (params.inscriptionDebut) {
      sp.set("inscriptionDebut", params.inscriptionDebut);
    }
    if (params.inscriptionFin) {
      sp.set("inscriptionFin", params.inscriptionFin);
    }
  }
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  if (params.limit && params.limit !== DEFAULT_HABITANTS_PAGE_SIZE) {
    sp.set("limit", String(params.limit));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export function hasActiveInscriptionFilter(
  params: HabitantsListParams,
): boolean {
  if (params.inscription === "semaine" || params.inscription === "mois") {
    return true;
  }
  if (params.inscription === "perso") {
    return (
      isIsoDate(params.inscriptionDebut) || isIsoDate(params.inscriptionFin)
    );
  }
  return false;
}

export function resolveHabitantsInscriptionRange(
  params: HabitantsListParams,
): { from?: string; to?: string } {
  const now = parisNow();

  if (params.inscription === "semaine") {
    return {
      from: startOfWeek(now, { weekStartsOn: 1 }).toISOString(),
      to: endOfWeek(now, { weekStartsOn: 1 }).toISOString(),
    };
  }

  if (params.inscription === "mois") {
    return {
      from: startOfMonth(now).toISOString(),
      to: endOfMonth(now).toISOString(),
    };
  }

  if (params.inscription === "perso") {
    const from =
      params.inscriptionDebut && isIsoDate(params.inscriptionDebut)
        ? startOfDay(new TZDate(params.inscriptionDebut, TIMEZONE)).toISOString()
        : undefined;
    const to =
      params.inscriptionFin && isIsoDate(params.inscriptionFin)
        ? endOfDay(new TZDate(params.inscriptionFin, TIMEZONE)).toISOString()
        : undefined;

    if (!from && !to) return {};
    return { from, to };
  }

  return {};
}

export function getInscriptionWeekLabel(): string {
  const now = parisNow();
  const start = startOfWeek(now, { weekStartsOn: 1 });
  const end = endOfWeek(now, { weekStartsOn: 1 });
  return `${format(start, "d MMM", { locale: fr })} – ${format(end, "d MMM", { locale: fr })}`;
}

export function getInscriptionMonthLabel(): string {
  return format(parisNow(), "MMMM yyyy", { locale: fr });
}

export function isValidInscriptionDateRange(
  debut?: string,
  fin?: string,
): boolean {
  if (!debut || !fin) return true;
  if (!isIsoDate(debut) || !isIsoDate(fin)) return true;
  const start = parseISO(debut);
  const end = parseISO(fin);
  if (!isValid(start) || !isValid(end)) return true;
  return start.getTime() <= end.getTime();
}

export function activeHabitantsFilterCount(params: HabitantsListParams): number {
  let count = params.statuses.length + params.roles.length;
  if (hasActiveInscriptionFilter(params)) count += 1;
  return count;
}

export function hasActiveHabitantsFilters(params: HabitantsListParams): boolean {
  return activeHabitantsFilterCount(params) > 0;
}
