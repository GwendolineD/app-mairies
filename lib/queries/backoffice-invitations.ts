import type { SupabaseClient } from "@supabase/supabase-js";
import type { InvitationDerivedStatus } from "@/lib/utils/backoffice-invitations-params";
import type { BackofficeInvitationsListParams } from "@/lib/utils/backoffice-invitations-params";

export type InvitationListRow = {
  id: string;
  email: string;
  communeId: string;
  communeName: string;
  inviterName: string;
  inviterUserId: string | null;
  intendedRole: string;
  status: InvitationDerivedStatus;
  reminderSent: boolean;
  createdAt: string;
  acceptedAt: string | null;
  expiresAt: string | null;
};

type InviteProfile = {
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
};

type InviteMembership = {
  user_id: string;
  profile: InviteProfile | InviteProfile[] | null;
};

type InviteCommune = {
  id: string;
  name: string;
};

type InviteRow = {
  id: string;
  email: string;
  commune_id: string;
  intended_role: string;
  inviter_user_id: string | null;
  created_at: string;
  accepted_at: string | null;
  expires_at: string | null;
  reminder_sent_at: string | null;
  commune: InviteCommune | InviteCommune[] | null;
  inviter: InviteMembership | InviteMembership[] | null;
};

function resolveOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function formatInviterName(profile: InviteProfile | null): string {
  if (!profile) return "Utilisateur·rice";
  const parts = [profile.first_name, profile.last_name].filter(Boolean);
  if (parts.length > 0) return parts.join(" ");
  return profile.display_name?.trim() || "Utilisateur·rice";
}

export function deriveInvitationStatus(row: {
  accepted_at: string | null;
  expires_at: string | null;
}): InvitationDerivedStatus {
  if (row.accepted_at) return "accepted";
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
    return "expired";
  }
  return "pending";
}

function applyDateRange<T extends { gte: Function; lte: Function }>(
  query: T,
  dateFrom?: string,
  dateTo?: string,
): T {
  let next = query;
  if (dateFrom) {
    next = next.gte("created_at", `${dateFrom}T00:00:00.000Z`) as T;
  }
  if (dateTo) {
    next = next.lte("created_at", `${dateTo}T23:59:59.999Z`) as T;
  }
  return next;
}

function applyInvitationStatusFilter<T extends { not: Function; is: Function; or: Function; lt: Function }>(
  query: T,
  status?: InvitationDerivedStatus,
): T {
  if (!status) return query;

  const now = new Date().toISOString();

  if (status === "accepted") {
    return query.not("accepted_at", "is", null) as T;
  }

  if (status === "expired") {
    return query
      .is("accepted_at", null)
      .not("expires_at", "is", null)
      .lt("expires_at", now) as T;
  }

  return query
    .is("accepted_at", null)
    .or(`expires_at.is.null,expires_at.gte.${now}`) as T;
}

function applyInvitationStatusesFilter<
  T extends { not: Function; is: Function; or: Function; lt: Function },
>(query: T, statuses: InvitationDerivedStatus[]): T {
  if (statuses.length === 0) return query;
  if (statuses.length === 1) {
    return applyInvitationStatusFilter(query, statuses[0]);
  }

  const now = new Date().toISOString();
  const parts: string[] = [];

  if (statuses.includes("accepted")) {
    parts.push("accepted_at.not.is.null");
  }
  if (statuses.includes("expired")) {
    parts.push(
      `and(accepted_at.is.null,expires_at.not.is.null,expires_at.lt.${now})`,
    );
  }
  if (statuses.includes("pending")) {
    parts.push(
      `and(accepted_at.is.null,or(expires_at.is.null,expires_at.gte.${now}))`,
    );
  }

  if (parts.length === 0) return query;
  return query.or(parts.join(",")) as T;
}

function applyInvitationFilters<
  T extends {
    ilike: Function;
    eq: Function;
    in: Function;
    not: Function;
    is: Function;
    or: Function;
    lt: Function;
    gte: Function;
    lte: Function;
  },
>(query: T, params: BackofficeInvitationsListParams): T {
  let next = query;

  if (params.q) {
    next = next.ilike("email", `%${params.q}%`) as T;
  }

  if (params.communes.length === 1) {
    next = next.eq("commune_id", params.communes[0]) as T;
  } else if (params.communes.length > 1) {
    next = next.in("commune_id", params.communes) as T;
  }

  next = applyInvitationStatusesFilter(next, params.statuses);

  if (params.reminded === true) {
    next = next.not("reminder_sent_at", "is", null) as T;
  } else if (params.reminded === false) {
    next = next.is("reminder_sent_at", null) as T;
  }

  next = applyDateRange(next, params.dateFrom, params.dateTo);
  return next;
}

function mapInvitationRow(row: InviteRow): InvitationListRow {
  const commune = resolveOne(row.commune);
  const inviter = resolveOne(row.inviter);
  const profile = resolveOne(inviter?.profile ?? null);

  return {
    id: row.id,
    email: row.email,
    communeId: row.commune_id,
    communeName: commune?.name ?? "Commune inconnue",
    inviterName: formatInviterName(profile),
    inviterUserId: inviter?.user_id ?? row.inviter_user_id ?? null,
    intendedRole: row.intended_role ?? "member",
    status: deriveInvitationStatus(row),
    reminderSent: row.reminder_sent_at !== null,
    createdAt: row.created_at,
    acceptedAt: row.accepted_at,
    expiresAt: row.expires_at,
  };
}

export async function listInvitationsPage(
  supabase: SupabaseClient,
  params: BackofficeInvitationsListParams,
): Promise<{ items: InvitationListRow[]; totalCount: number }> {
  const offset = (params.page - 1) * params.limit;

  let countQuery = supabase
    .from("neighbor_invites")
    .select("id", { count: "exact", head: true });

  let dataQuery = supabase
    .from("neighbor_invites")
    .select(
      `
        id,
        email,
        commune_id,
        intended_role,
        inviter_user_id,
        created_at,
        accepted_at,
        expires_at,
        reminder_sent_at,
        commune:communes!neighbor_invites_commune_id_fkey(id, name),
        inviter:memberships!neighbor_invites_inviter_membership_id_fkey(
          user_id,
          profile:profiles!memberships_profiles_user_id_fkey(first_name, last_name, display_name)
        )
      `,
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + params.limit - 1);

  countQuery = applyInvitationFilters(countQuery, params);
  dataQuery = applyInvitationFilters(dataQuery, params);

  const [{ count }, { data, error }] = await Promise.all([
    countQuery,
    dataQuery,
  ]);

  if (error) {
    return { items: [], totalCount: 0 };
  }

  return {
    items: ((data ?? []) as InviteRow[]).map(mapInvitationRow),
    totalCount: count ?? 0,
  };
}
