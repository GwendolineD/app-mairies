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

function parseInvitationStatus(
  value: string | undefined,
): InvitationDerivedStatus | undefined {
  if (!value) return undefined;
  return (Object.values(INVITATION_DERIVED_STATUS) as string[]).includes(value)
    ? (value as InvitationDerivedStatus)
    : undefined;
}

export type BackofficeUtilisateursListParams = {
  tab: BackofficeUtilisateursTab;
  q: string;
  commune?: string;
  role?: MembershipRole;
  membershipStatus?: MembershipStatus;
  banned?: boolean;
  admin?: boolean;
  invitationStatus?: InvitationDerivedStatus;
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
  const commune = (raw(searchParams, "commune") ?? "").trim() || undefined;

  return {
    tab: parseTab(raw(searchParams, "tab")),
    q: (raw(searchParams, "q") ?? "").trim(),
    commune,
    role: parseMembershipRole(raw(searchParams, "role")),
    membershipStatus: parseMembershipStatus(raw(searchParams, "membershipStatus")),
    banned: parseBooleanFlag(raw(searchParams, "banned")),
    admin: parseBooleanFlag(raw(searchParams, "admin")),
    invitationStatus: parseInvitationStatus(raw(searchParams, "invitationStatus")),
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
    if (params.invitationStatus) {
      sp.set("invitationStatus", params.invitationStatus);
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
  if (params.commune) count += 1;

  if (params.tab === "users") {
    if (params.role) count += 1;
    if (params.membershipStatus) count += 1;
    if (params.banned != null) count += 1;
    if (params.admin != null) count += 1;
    if (params.dateFrom) count += 1;
    if (params.dateTo) count += 1;
  }

  if (params.tab === "invitations") {
    if (params.invitationStatus) count += 1;
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
    commune: params.commune,
    status: params.invitationStatus,
    reminded: params.reminded,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    page: params.page,
    limit: params.limit,
  };
}
