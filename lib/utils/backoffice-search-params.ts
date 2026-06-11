import type { MembershipRole, MembershipStatus, SubscriptionStatus } from "@/lib/types";
import {
  ALL_SUBSCRIPTION_STATUSES,
  BACKOFFICE_COMMUNES_PAGE_SIZES,
  BACKOFFICE_MEMBERS_PAGE_SIZES,
  DEFAULT_BACKOFFICE_COMMUNES_PAGE_SIZE,
  DEFAULT_BACKOFFICE_MEMBERS_PAGE_SIZE,
  PILOT_SUBSCRIPTION_STATUSES,
} from "@/lib/constants/subscription-status";

const VALID_SUBSCRIPTION_STATUSES = new Set<string>(ALL_SUBSCRIPTION_STATUSES);

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

function rawAll(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
): string[] {
  const value = searchParams[key];
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function parseSubscriptionStatuses(
  searchParams: Record<string, string | string[] | undefined>,
): SubscriptionStatus[] {
  const seen = new Set<SubscriptionStatus>();
  const statuses: SubscriptionStatus[] = [];

  for (const rawValue of rawAll(searchParams, "status")) {
    if (!VALID_SUBSCRIPTION_STATUSES.has(rawValue)) continue;
    const status = rawValue as SubscriptionStatus;
    if (seen.has(status)) continue;
    seen.add(status);
    statuses.push(status);
  }

  return statuses;
}

export type BackofficeCommunesListParams = {
  q: string;
  statuses: SubscriptionStatus[];
  page: number;
  limit: number;
};

export function parseBackofficeCommunesListParams(
  searchParams: Record<string, string | string[] | undefined>,
): BackofficeCommunesListParams {
  return {
    q: (raw(searchParams, "q") ?? "").trim(),
    statuses: parseSubscriptionStatuses(searchParams),
    page: parsePage(raw(searchParams, "page")),
    limit: parseLimit(
      raw(searchParams, "limit"),
      BACKOFFICE_COMMUNES_PAGE_SIZES,
      DEFAULT_BACKOFFICE_COMMUNES_PAGE_SIZE,
    ),
  };
}

export function buildBackofficeCommunesListQuery(
  params: Partial<BackofficeCommunesListParams>,
): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  for (const status of params.statuses ?? []) {
    sp.append("status", status);
  }
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  if (params.limit && params.limit !== DEFAULT_BACKOFFICE_COMMUNES_PAGE_SIZE) {
    sp.set("limit", String(params.limit));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export type BackofficeMembersListParams = {
  q: string;
  role?: MembershipRole;
  status?: MembershipStatus;
  page: number;
  limit: number;
};

export function parseBackofficeMembersListParams(
  searchParams: Record<string, string | string[] | undefined>,
): BackofficeMembersListParams {
  const roleRaw = raw(searchParams, "role");
  const statusRaw = raw(searchParams, "status");

  const role =
    roleRaw === "member" || roleRaw === "staff" || roleRaw === "mayor"
      ? roleRaw
      : undefined;
  const status =
    statusRaw === "active" || statusRaw === "suspended" ? statusRaw : undefined;

  return {
    q: (raw(searchParams, "q") ?? "").trim(),
    role,
    status,
    page: parsePage(raw(searchParams, "page")),
    limit: parseLimit(
      raw(searchParams, "limit"),
      BACKOFFICE_MEMBERS_PAGE_SIZES,
      DEFAULT_BACKOFFICE_MEMBERS_PAGE_SIZE,
    ),
  };
}

export function buildBackofficeMembersListQuery(
  params: Partial<BackofficeMembersListParams>,
): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.role) sp.set("role", params.role);
  if (params.status) sp.set("status", params.status);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  if (params.limit && params.limit !== DEFAULT_BACKOFFICE_MEMBERS_PAGE_SIZE) {
    sp.set("limit", String(params.limit));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export { ALL_SUBSCRIPTION_STATUSES, PILOT_SUBSCRIPTION_STATUSES };
