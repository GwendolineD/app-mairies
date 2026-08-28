import {
  INVITATION_DERIVED_STATUS,
  type InvitationDerivedStatus,
} from "@/lib/utils/backoffice-invitations-params";
import { MEMBERSHIP_ROLES } from "@/lib/constants/roles";
import { MEMBERSHIP_STATUS } from "@/lib/constants/statuses";
import type { MembershipRole, MembershipStatus } from "@/lib/types";

export const BACKOFFICE_UTILISATEURS_TABS = [
  "stats",
  "users",
  "invitations",
] as const;

export type BackofficeUtilisateursTab =
  (typeof BACKOFFICE_UTILISATEURS_TABS)[number];

export const BACKOFFICE_UTILISATEURS_TAB_LABELS: Record<
  BackofficeUtilisateursTab,
  string
> = {
  users: "Utilisateurs",
  invitations: "Invitations",
  stats: "Statistiques",
};

export const BACKOFFICE_UTILISATEURS_PAGE_SIZES = [10, 25, 50] as const;
export const DEFAULT_BACKOFFICE_UTILISATEURS_PAGE_SIZE = 25;

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

function parseTab(value: string | undefined): BackofficeUtilisateursTab {
  if (
    value &&
    (BACKOFFICE_UTILISATEURS_TABS as readonly string[]).includes(value)
  ) {
    return value as BackofficeUtilisateursTab;
  }
  return "users";
}

function parseBooleanFlag(value: string | undefined): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function parseMembershipRole(
  value: string | undefined,
): MembershipRole | undefined {
  if (!value) return undefined;
  return (Object.values(MEMBERSHIP_ROLES) as string[]).includes(value)
    ? (value as MembershipRole)
    : undefined;
}

function parseMembershipStatus(
  value: string | undefined,
): MembershipStatus | undefined {
  if (!value) return undefined;
  return (Object.values(MEMBERSHIP_STATUS) as string[]).includes(value)
    ? (value as MembershipStatus)
    : undefined;
}

function parseInvitationStatuses(
  searchParams: Record<string, string | string[] | undefined>,
): InvitationDerivedStatus[] {
  const seen = new Set<InvitationDerivedStatus>();
  const statuses: InvitationDerivedStatus[] = [];

  for (const rawValue of rawAll(searchParams, "invitationStatus")) {
    if (
      !(Object.values(INVITATION_DERIVED_STATUS) as string[]).includes(rawValue)
    ) {
      continue;
    }
    const status = rawValue as InvitationDerivedStatus;
    if (seen.has(status)) continue;
    seen.add(status);
    statuses.push(status);
  }

  return statuses;
}

function parseCommuneIds(
  searchParams: Record<string, string | string[] | undefined>,
): string[] {
  const seen = new Set<string>();
  const communes: string[] = [];

  for (const rawValue of rawAll(searchParams, "commune")) {
    const trimmed = rawValue.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    communes.push(trimmed);
  }

  return communes;
}

export type BackofficeUtilisateursListParams = {
  tab: BackofficeUtilisateursTab;
  q: string;
  commune?: string;
  role?: MembershipRole;
  membershipStatus?: MembershipStatus;
  banned?: boolean;
  admin?: boolean;
  invitationStatuses: InvitationDerivedStatus[];
  communes: string[];
  reminded?: boolean;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  limit: number;
};

export function parseBackofficeUtilisateursParams(
  searchParams: Record<string, string | string[] | undefined>,
): BackofficeUtilisateursListParams {
  const dateFrom = (raw(searchParams, "dateFrom") ?? "").trim() || undefined;
  const dateTo = (raw(searchParams, "dateTo") ?? "").trim() || undefined;
  const tab = parseTab(raw(searchParams, "tab"));
  const communeIds = parseCommuneIds(searchParams);

  return {
    tab,
    q: (raw(searchParams, "q") ?? "").trim(),
    commune: tab === "users" ? communeIds[0] : undefined,
    communes: tab === "invitations" ? communeIds : [],
    role: parseMembershipRole(raw(searchParams, "role")),
    membershipStatus: parseMembershipStatus(raw(searchParams, "membershipStatus")),
    banned: parseBooleanFlag(raw(searchParams, "banned")),
    admin: parseBooleanFlag(raw(searchParams, "admin")),
    invitationStatuses:
      tab === "invitations" ? parseInvitationStatuses(searchParams) : [],
    reminded: parseBooleanFlag(raw(searchParams, "reminded")),
    dateFrom,
    dateTo,
    page: parsePage(raw(searchParams, "page")),
    limit: parseLimit(
      raw(searchParams, "limit"),
      BACKOFFICE_UTILISATEURS_PAGE_SIZES,
      DEFAULT_BACKOFFICE_UTILISATEURS_PAGE_SIZE,
    ),
  };
}

export function buildBackofficeUtilisateursListQuery(
  params: Partial<BackofficeUtilisateursListParams>,
): string {
  const sp = new URLSearchParams();
  const tab = params.tab ?? "users";

  if (tab !== "users") sp.set("tab", tab);
  if (params.q) sp.set("q", params.q);
  if (params.commune) sp.set("commune", params.commune);

  if (tab === "users") {
    if (params.role) sp.set("role", params.role);
    if (params.membershipStatus) {
      sp.set("membershipStatus", params.membershipStatus);
    }
    if (params.banned === true) sp.set("banned", "true");
    if (params.banned === false) sp.set("banned", "false");
    if (params.admin === true) sp.set("admin", "true");
    if (params.admin === false) sp.set("admin", "false");
  }

  if (tab === "invitations") {
    for (const status of params.invitationStatuses ?? []) {
      sp.append("invitationStatus", status);
    }
    for (const commune of params.communes ?? []) {
      sp.append("commune", commune);
    }
    if (params.reminded === true) sp.set("reminded", "true");
    if (params.reminded === false) sp.set("reminded", "false");
  }

  if (tab === "users" || tab === "invitations") {
    if (params.dateFrom) sp.set("dateFrom", params.dateFrom);
    if (params.dateTo) sp.set("dateTo", params.dateTo);
    if (params.page && params.page > 1) sp.set("page", String(params.page));
    if (
      params.limit &&
      params.limit !== DEFAULT_BACKOFFICE_UTILISATEURS_PAGE_SIZE
    ) {
      sp.set("limit", String(params.limit));
    }
  }

  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export function activeBackofficeUtilisateursFilterCount(
  params: BackofficeUtilisateursListParams,
): number {
  let count = 0;

  if (params.tab === "users") {
    if (params.commune) count += 1;
    if (params.role) count += 1;
    if (params.membershipStatus) count += 1;
    if (params.banned != null) count += 1;
    if (params.admin != null) count += 1;
    if (params.dateFrom) count += 1;
    if (params.dateTo) count += 1;
  }

  if (params.tab === "invitations") {
    if (params.communes.length > 0) count += 1;
    if (params.invitationStatuses.length > 0) count += 1;
    if (params.reminded != null) count += 1;
    if (params.dateFrom) count += 1;
    if (params.dateTo) count += 1;
  }

  return count;
}

export function toInvitationsListParams(
  params: BackofficeUtilisateursListParams,
) {
  return {
    q: params.q,
    communes: params.communes,
    statuses: params.invitationStatuses,
    reminded: params.reminded,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    page: params.page,
    limit: params.limit,
  };
}
