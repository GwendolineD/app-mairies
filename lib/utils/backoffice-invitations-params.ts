export const INVITATION_DERIVED_STATUS = {
  pending: "pending",
  accepted: "accepted",
  expired: "expired",
} as const;

export type InvitationDerivedStatus =
  (typeof INVITATION_DERIVED_STATUS)[keyof typeof INVITATION_DERIVED_STATUS];

export const INVITATION_DERIVED_STATUS_LABELS: Record<
  InvitationDerivedStatus,
  string
> = {
  pending: "En attente",
  accepted: "Acceptée",
  expired: "Expirée",
};

export const BACKOFFICE_INVITATIONS_PAGE_SIZES = [10, 25, 50] as const;
export const DEFAULT_BACKOFFICE_INVITATIONS_PAGE_SIZE = 25;

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

function parseInvitationStatus(
  value: string | undefined,
): InvitationDerivedStatus | undefined {
  if (!value) return undefined;
  return (Object.values(INVITATION_DERIVED_STATUS) as string[]).includes(value)
    ? (value as InvitationDerivedStatus)
    : undefined;
}

function parseBooleanFlag(value: string | undefined): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export type BackofficeInvitationsListParams = {
  q: string;
  commune?: string;
  status?: InvitationDerivedStatus;
  reminded?: boolean;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  limit: number;
};

export function parseBackofficeInvitationsListParams(
  searchParams: Record<string, string | string[] | undefined>,
): BackofficeInvitationsListParams {
  const dateFrom = (raw(searchParams, "dateFrom") ?? "").trim() || undefined;
  const dateTo = (raw(searchParams, "dateTo") ?? "").trim() || undefined;
  const commune = (raw(searchParams, "commune") ?? "").trim() || undefined;
  const reminded = parseBooleanFlag(raw(searchParams, "reminded"));

  return {
    q: (raw(searchParams, "q") ?? "").trim(),
    commune,
    status: parseInvitationStatus(raw(searchParams, "status")),
    reminded,
    dateFrom,
    dateTo,
    page: parsePage(raw(searchParams, "page")),
    limit: parseLimit(
      raw(searchParams, "limit"),
      BACKOFFICE_INVITATIONS_PAGE_SIZES,
      DEFAULT_BACKOFFICE_INVITATIONS_PAGE_SIZE,
    ),
  };
}

export function buildBackofficeInvitationsListQuery(
  params: Partial<BackofficeInvitationsListParams>,
): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.commune) sp.set("commune", params.commune);
  if (params.status) sp.set("status", params.status);
  if (params.reminded === true) sp.set("reminded", "true");
  if (params.reminded === false) sp.set("reminded", "false");
  if (params.dateFrom) sp.set("dateFrom", params.dateFrom);
  if (params.dateTo) sp.set("dateTo", params.dateTo);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  if (
    params.limit &&
    params.limit !== DEFAULT_BACKOFFICE_INVITATIONS_PAGE_SIZE
  ) {
    sp.set("limit", String(params.limit));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}
