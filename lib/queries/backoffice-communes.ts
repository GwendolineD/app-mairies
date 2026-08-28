import type { SupabaseClient } from "@supabase/supabase-js";
import { ALL_ACCESS_STATUSES, PILOT_ACCESS_STATUSES } from "@/lib/constants/access-status";
import { todayParisYmd } from "@/lib/datetime";
import { createServiceClient } from "@/lib/supabase/server";
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
  hasActiveSubscription: boolean;
  currentPaymentStatus: "paid" | "unpaid" | null;
};

async function fetchActiveCountsByCommuneIds(
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

  const serviceClient = await createServiceClient();
  const { data, error } = await serviceClient.rpc(
    "count_active_content_by_communes",
    { p_commune_ids: communeIds },
  );

  const members = new Map<string, number>();
  const announcements = new Map<string, number>();
  const initiatives = new Map<string, number>();
  const events = new Map<string, number>();

  if (error || !data) {
    return { members, announcements, initiatives, events };
  }

  for (const row of data) {
    members.set(row.commune_id, Number(row.members ?? 0));
    announcements.set(row.commune_id, Number(row.announcements ?? 0));
    initiatives.set(row.commune_id, Number(row.initiatives ?? 0));
    events.set(row.commune_id, Number(row.events ?? 0));
  }

  return { members, announcements, initiatives, events };
}

async function fetchActiveSubscriptionsByCommuneIds(
  supabase: SupabaseClient,
  communeIds: string[],
): Promise<Map<string, "paid" | "unpaid">> {
  if (communeIds.length === 0) return new Map();

  const today = todayParisYmd();
  const { data } = await supabase
    .from("commune_subscriptions")
    .select("commune_id, payment_status")
    .in("commune_id", communeIds)
    .lte("starts_at", today)
    .gte("ends_at", today);

  const map = new Map<string, "paid" | "unpaid">();
  for (const row of data ?? []) {
    if (!map.has(row.commune_id)) {
      map.set(
        row.commune_id,
        row.payment_status as "paid" | "unpaid",
      );
    }
  }
  return map;
}

function matchesSubscriptionFilters(
  communeId: string,
  subscriptions: Map<string, "paid" | "unpaid">,
  params: BackofficeCommunesListParams,
): boolean {
  const hasActive = subscriptions.has(communeId);
  const paymentStatus = subscriptions.get(communeId) ?? null;

  if (params.subscription === "with" && !hasActive) return false;
  if (params.subscription === "without" && hasActive) return false;
  if (params.subscription === "with" && params.payment === "paid" && paymentStatus !== "paid") {
    return false;
  }
  if (params.subscription === "with" && params.payment === "unpaid" && paymentStatus !== "unpaid") {
    return false;
  }

  return true;
}

export type PilotCommuneOption = {
  id: string;
  name: string;
  postcode: string | null;
};

export async function listPilotCommuneOptions(
  supabase: SupabaseClient,
): Promise<PilotCommuneOption[]> {
  const { data, error } = await supabase
    .from("communes")
    .select("id, name, postcode")
    .in("access_status", [...PILOT_ACCESS_STATUSES])
    .order("name");

  if (error) return [];
  return (data ?? []) as PilotCommuneOption[];
}

export async function listPilotCommunesPage(
  supabase: SupabaseClient,
  params: BackofficeCommunesListParams,
): Promise<{ items: CommuneListRow[]; totalCount: number }> {
  const statuses =
    params.statuses.length > 0 ? params.statuses : [...ALL_ACCESS_STATUSES];

  const hasSubscriptionFilters =
    params.subscription != null ||
    (params.subscription === "with" && params.payment != null);

  let dataQuery = supabase
    .from("communes")
    .select("id, name, postcode, access_status, created_at")
    .in("access_status", statuses)
    .order("name");

  if (params.q) {
    const pattern = `%${params.q}%`;
    const filter = `name.ilike.${pattern},postcode.ilike.${pattern}`;
    dataQuery = dataQuery.or(filter);
  }

  const { data, error } = await dataQuery;

  if (error) {
    return { items: [], totalCount: 0 };
  }

  const allRows = data ?? [];
  const allCommuneIds = allRows.map((row) => row.id);
  const subscriptions = await fetchActiveSubscriptionsByCommuneIds(
    supabase,
    allCommuneIds,
  );

  const filteredRows = hasSubscriptionFilters
    ? allRows.filter((row) =>
        matchesSubscriptionFilters(row.id, subscriptions, params),
      )
    : allRows;

  const totalCount = filteredRows.length;
  const offset = (params.page - 1) * params.limit;
  const pageRows = filteredRows.slice(offset, offset + params.limit);
  const communeIds = pageRows.map((row) => row.id);
  const counts = await fetchActiveCountsByCommuneIds(communeIds);

  const items: CommuneListRow[] = pageRows.map((row) => {
    const paymentStatus = subscriptions.get(row.id) ?? null;
    return {
      id: row.id,
      name: row.name,
      postcode: row.postcode,
      access_status: row.access_status as AccessStatus,
      created_at: row.created_at,
      activeMembersCount: counts.members.get(row.id) ?? 0,
      activeAnnouncementsCount: counts.announcements.get(row.id) ?? 0,
      activeInitiativesCount: counts.initiatives.get(row.id) ?? 0,
      activeEventsCount: counts.events.get(row.id) ?? 0,
      hasActiveSubscription: paymentStatus != null,
      currentPaymentStatus: paymentStatus,
    };
  });

  return { items, totalCount };
}

export type CommuneDetailStats = {
  commune: {
    id: string;
    name: string;
    postcode: string | null;
    insee_code: string;
    access_status: AccessStatus;
    trial_max_members: number;
    created_at: string;
    welcomeMessage: string;
    mairie_address_street: string | null;
    mairie_address_city: string | null;
    mairie_address_postcode: string | null;
    mairie_address_lat: number | null;
    mairie_address_lng: number | null;
    siret: string | null;
    population: number | null;
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
      "id, name, postcode, insee_code, access_status, trial_max_members, created_at, settings, mairie_address_street, mairie_address_city, mairie_address_postcode, mairie_address_lat, mairie_address_lng, siret, population",
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
      trial_max_members: (commune.trial_max_members as number) ?? 30,
      created_at: commune.created_at,
      welcomeMessage,
      mairie_address_street: commune.mairie_address_street as string | null,
      mairie_address_city: commune.mairie_address_city as string | null,
      mairie_address_postcode: commune.mairie_address_postcode as string | null,
      mairie_address_lat: commune.mairie_address_lat as number | null,
      mairie_address_lng: commune.mairie_address_lng as number | null,
      siret: commune.siret as string | null,
      population: commune.population as number | null,
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
