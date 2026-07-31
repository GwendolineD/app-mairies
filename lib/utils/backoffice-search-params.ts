import type { MembershipRole, MembershipStatus, AccessStatus } from "@/lib/types";
import {
  ALL_ACCESS_STATUSES,
  BACKOFFICE_COMMUNES_PAGE_SIZES,
  BACKOFFICE_MEMBERS_PAGE_SIZES,
  DEFAULT_BACKOFFICE_COMMUNES_PAGE_SIZE,
  DEFAULT_BACKOFFICE_MEMBERS_PAGE_SIZE,
  PILOT_ACCESS_STATUSES,
} from "@/lib/constants/access-status";

const VALID_ACCESS_STATUSES = new Set<string>(ALL_ACCESS_STATUSES);

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

function parseAccessStatuses(
  searchParams: Record<string, string | string[] | undefined>,
): AccessStatus[] {
  const seen = new Set<AccessStatus>();
  const statuses: AccessStatus[] = [];

  for (const rawValue of rawAll(searchParams, "status")) {
    if (!VALID_ACCESS_STATUSES.has(rawValue)) continue;
    const status = rawValue as AccessStatus;
    if (seen.has(status)) continue;
    seen.add(status);
    statuses.push(status);
  }

  return statuses;
}

export type CommuneSubscriptionFilter = "with" | "without";
export type CommunePaymentFilter = "paid" | "unpaid";

export type BackofficeCommunesListParams = {
  q: string;
  statuses: AccessStatus[];
  subscription?: CommuneSubscriptionFilter;
  payment?: CommunePaymentFilter;
  page: number;
  limit: number;
};

function parseCommuneSubscriptionFilter(
  value: string | undefined,
): CommuneSubscriptionFilter | undefined {
  if (value === "with" || value === "without") return value;
  return undefined;
}

function parseCommunePaymentFilter(
  value: string | undefined,
): CommunePaymentFilter | undefined {
  if (value === "paid" || value === "unpaid") return value;
  return undefined;
}

export function parseBackofficeCommunesListParams(
  searchParams: Record<string, string | string[] | undefined>,
): BackofficeCommunesListParams {
  const subscription = parseCommuneSubscriptionFilter(
    raw(searchParams, "subscription"),
  );
  const paymentRaw = parseCommunePaymentFilter(raw(searchParams, "payment"));

  return {
    q: (raw(searchParams, "q") ?? "").trim(),
    statuses: parseAccessStatuses(searchParams),
    subscription,
    payment: subscription === "with" ? paymentRaw : undefined,
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
  if (params.subscription) sp.set("subscription", params.subscription);
  if (params.subscription === "with" && params.payment) {
    sp.set("payment", params.payment);
  }
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  if (params.limit && params.limit !== DEFAULT_BACKOFFICE_COMMUNES_PAGE_SIZE) {
    sp.set("limit", String(params.limit));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export type MemberNotificationsFilter = "active" | "inactive";

export type BackofficeMembersListParams = {
  q: string;
  role?: MembershipRole;
  /** @deprecated Prefer `statuses` — kept for single-status URLs */
  status?: MembershipStatus;
  statuses: MembershipStatus[];
  banned?: boolean;
  notifications?: MemberNotificationsFilter;
  page: number;
  limit: number;
};

function parseMembershipStatuses(
  searchParams: Record<string, string | string[] | undefined>,
): MembershipStatus[] {
  const seen = new Set<MembershipStatus>();
  const statuses: MembershipStatus[] = [];

  for (const rawValue of rawAll(searchParams, "status")) {
    if (rawValue !== "active" && rawValue !== "suspended") continue;
    const status = rawValue as MembershipStatus;
    if (seen.has(status)) continue;
    seen.add(status);
    statuses.push(status);
  }

  return statuses;
}

export function parseBackofficeMembersListParams(
  searchParams: Record<string, string | string[] | undefined>,
): BackofficeMembersListParams {
  const roleRaw = raw(searchParams, "role");
  const notificationsRaw = raw(searchParams, "notifications");
  const bannedRaw = raw(searchParams, "banned");

  const role =
    roleRaw === "member" || roleRaw === "staff" || roleRaw === "mayor"
      ? roleRaw
      : undefined;
  const statuses = parseMembershipStatuses(searchParams);
  const status = statuses.length === 1 ? statuses[0] : undefined;
  const notifications =
    notificationsRaw === "active" || notificationsRaw === "inactive"
      ? notificationsRaw
      : undefined;

  return {
    q: (raw(searchParams, "q") ?? "").trim(),
    role,
    status,
    statuses,
    banned: bannedRaw === "true" ? true : undefined,
    notifications,
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
  const statuses =
    params.statuses ??
    (params.status ? [params.status] : undefined);
  for (const status of statuses ?? []) {
    sp.append("status", status);
  }
  if (params.banned) sp.set("banned", "true");
  if (params.notifications) sp.set("notifications", params.notifications);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  if (params.limit && params.limit !== DEFAULT_BACKOFFICE_MEMBERS_PAGE_SIZE) {
    sp.set("limit", String(params.limit));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export function activeBackofficeMembersFilterCount(
  params: BackofficeMembersListParams,
): number {
  let count = 0;
  if (params.statuses.length > 0) count += 1;
  if (params.banned) count += 1;
  if (params.role) count += 1;
  if (params.notifications) count += 1;
  return count;
}

export { ALL_ACCESS_STATUSES, PILOT_ACCESS_STATUSES };

export function activeBackofficeCommunesFilterCount(
  params: BackofficeCommunesListParams,
): number {
  let count = 0;
  if (params.statuses.length > 0) count += 1;
  if (params.subscription) count += 1;
  if (params.subscription === "with" && params.payment) count += 1;
  return count;
}
