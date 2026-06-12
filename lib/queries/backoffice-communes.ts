import type { SupabaseClient } from "@supabase/supabase-js";
import { ALL_ACCESS_STATUSES } from "@/lib/constants/access-status";
import type { BackofficeCommunesListParams } from "@/lib/utils/backoffice-search-params";
import type { AccessStatus } from "@/lib/types";

export type CommuneListRow = {
  id: string;
  name: string;
  postcode: string | null;
  access_status: AccessStatus;
  created_at: string;
  activeMembersCount: number;
  activeAnnouncementsCount: number;
  activeInitiativesCount: number;
  activeEventsCount: number;
};

function countByCommuneId(rows: { commune_id: string }[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.commune_id, (counts.get(row.commune_id) ?? 0) + 1);
  }
  return counts;
}

async function fetchActiveCountsByCommuneIds(
  supabase: SupabaseClient,
  communeIds: string[],
): Promise<{
  members: Map<string, number>;
  announcements: Map<string, number>;
  initiatives: Map<string, number>;
  events: Map<string, number>;
}> {
  if (communeIds.length === 0) {
    return {
      members: new Map(),
      announcements: new Map(),
      initiatives: new Map(),
      events: new Map(),
    };
  }

  const [
    { data: memberships },
    { data: announcements },
    { data: initiatives },
    { data: events },
  ] = await Promise.all([
    supabase
      .from("memberships")
      .select("commune_id")
      .in("commune_id", communeIds)
      .eq("status", "active"),
    supabase
      .from("announcements")
      .select("commune_id")
      .in("commune_id", communeIds)
      .eq("status", "ouverte"),
    supabase
      .from("initiatives")
      .select("commune_id")
      .in("commune_id", communeIds)
      .eq("status", "active"),
    supabase
      .from("events")
      .select("commune_id")
      .in("commune_id", communeIds)
      .eq("status", "active"),
  ]);

  return {
    members: countByCommuneId(memberships ?? []),
    announcements: countByCommuneId(announcements ?? []),
    initiatives: countByCommuneId(initiatives ?? []),
    events: countByCommuneId(events ?? []),
  };
}

export async function listPilotCommunesPage(
  supabase: SupabaseClient,
  params: BackofficeCommunesListParams,
): Promise<{ items: CommuneListRow[]; totalCount: number }> {
  const offset = (params.page - 1) * params.limit;
  const statuses =
    params.statuses.length > 0 ? params.statuses : [...ALL_ACCESS_STATUSES];

  let countQuery = supabase
    .from("communes")
    .select("id", { count: "exact", head: true })
    .in("access_status", statuses);

  let dataQuery = supabase
    .from("communes")
    .select("id, name, postcode, access_status, created_at")
    .in("access_status", statuses)
    .order("name")
    .range(offset, offset + params.limit - 1);

  if (params.q) {
    const pattern = `%${params.q}%`;
    const filter = `name.ilike.${pattern},postcode.ilike.${pattern}`;
    countQuery = countQuery.or(filter);
    dataQuery = dataQuery.or(filter);
  }

  const [{ count }, { data, error }] = await Promise.all([countQuery, dataQuery]);

  if (error) {
    return { items: [], totalCount: 0 };
  }

  const rows = data ?? [];
  const communeIds = rows.map((row) => row.id);
  const counts = await fetchActiveCountsByCommuneIds(supabase, communeIds);

  const items: CommuneListRow[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    postcode: row.postcode,
    access_status: row.access_status as AccessStatus,
    created_at: row.created_at,
    activeMembersCount: counts.members.get(row.id) ?? 0,
    activeAnnouncementsCount: counts.announcements.get(row.id) ?? 0,
    activeInitiativesCount: counts.initiatives.get(row.id) ?? 0,
    activeEventsCount: counts.events.get(row.id) ?? 0,
  }));

  return { items, totalCount: count ?? 0 };
}

export type CommuneDetailStats = {
  commune: {
    id: string;
    name: string;
    postcode: string | null;
    insee_code: string;
    access_status: AccessStatus;
    created_at: string;
    welcomeMessage: string;
  };
  activeMembersCount: number;
  activeAnnouncementsCount: number;
  activeInitiativesCount: number;
  activeEventsCount: number;
  totalAnnouncementsCount: number;
  totalInitiativesCount: number;
  totalEventsCount: number;
};

export async function getCommuneDetailStats(
  supabase: SupabaseClient,
  communeId: string,
): Promise<CommuneDetailStats | null> {
  const { data: commune, error } = await supabase
    .from("communes")
    .select(
      "id, name, postcode, insee_code, access_status, created_at, settings",
    )
    .eq("id", communeId)
    .maybeSingle();

  if (error || !commune) return null;

  const [
    { count: activeMembersCount },
    { count: activeAnnouncementsCount },
    { count: activeInitiativesCount },
    { count: activeEventsCount },
    { count: totalAnnouncementsCount },
    { count: totalInitiativesCount },
    { count: totalEventsCount },
  ] = await Promise.all([
    supabase
      .from("memberships")
      .select("*", { count: "exact", head: true })
      .eq("commune_id", communeId)
      .eq("status", "active"),
    supabase
      .from("announcements")
      .select("*", { count: "exact", head: true })
      .eq("commune_id", communeId)
      .eq("status", "ouverte"),
    supabase
      .from("initiatives")
      .select("*", { count: "exact", head: true })
      .eq("commune_id", communeId)
      .eq("status", "active"),
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("commune_id", communeId)
      .eq("status", "active"),
    supabase
      .from("announcements")
      .select("*", { count: "exact", head: true })
      .eq("commune_id", communeId),
    supabase
      .from("initiatives")
      .select("*", { count: "exact", head: true })
      .eq("commune_id", communeId),
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("commune_id", communeId),
  ]);

  const settings = (commune.settings ?? {}) as Record<string, unknown>;
  const welcomeMessage =
    typeof settings.welcomeMessage === "string" ? settings.welcomeMessage : "";

  return {
    commune: {
      id: commune.id,
      name: commune.name,
      postcode: commune.postcode,
      insee_code: commune.insee_code,
      access_status: commune.access_status as AccessStatus,
      created_at: commune.created_at,
      welcomeMessage,
    },
    activeMembersCount: activeMembersCount ?? 0,
    activeAnnouncementsCount: activeAnnouncementsCount ?? 0,
    activeInitiativesCount: activeInitiativesCount ?? 0,
    activeEventsCount: activeEventsCount ?? 0,
    totalAnnouncementsCount: totalAnnouncementsCount ?? 0,
    totalInitiativesCount: totalInitiativesCount ?? 0,
    totalEventsCount: totalEventsCount ?? 0,
  };
}
