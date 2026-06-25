import type { MembershipRole, MembershipStatus } from "@/lib/types";
import { MEMBERSHIP_ROLE_OPTIONS } from "@/lib/constants/roles";

export type HabitantsSort = "recent" | "name_asc" | "name_desc";

export type HabitantsListParams = {
  q: string;
  tri: HabitantsSort;
  statuses: MembershipStatus[];
  roles: MembershipRole[];
};

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

const STATUS_FILTER_SET = new Set<string>(
  HABITANTS_STATUS_FILTERS.map((item) => item.key),
);
const ROLE_FILTER_SET = new Set<string>(
  HABITANTS_ROLE_FILTERS.map((item) => item.key),
);

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

function isHabitantsSort(value: string | undefined): value is HabitantsSort {
  return value === "recent" || value === "name_asc" || value === "name_desc";
}

export function parseHabitantsListParams(
  searchParams: Record<string, string | string[] | undefined>,
): HabitantsListParams {
  const triRaw = raw(searchParams, "tri");
  const statuses = parseCsvParam(searchParams, "statut").filter(
    (value): value is MembershipStatus =>
      STATUS_FILTER_SET.has(value) && value !== "left",
  );
  const roles = parseCsvParam(searchParams, "role").filter(
    (value): value is MembershipRole => ROLE_FILTER_SET.has(value),
  );

  return {
    q: (raw(searchParams, "q") ?? "").trim(),
    tri: isHabitantsSort(triRaw) ? triRaw : "recent",
    statuses,
    roles,
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
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export function activeHabitantsFilterCount(params: HabitantsListParams): number {
  return params.statuses.length + params.roles.length;
}

export function hasActiveHabitantsFilters(params: HabitantsListParams): boolean {
  return activeHabitantsFilterCount(params) > 0;
}
