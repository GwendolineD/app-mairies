import type { SupabaseClient } from "@supabase/supabase-js";
import { buildPopulationOrFilter } from "@/lib/prospect-communes/population-buckets";
import type { ProspectCommunesListParams } from "@/lib/prospect-communes/filter-params";
import type {
  ProspectCommuneDetail,
  ProspectCommuneListItem,
} from "@/lib/prospect-communes/types";
import {
  PROSPECT_COMMUNE_LIST_SELECT,
  PROSPECT_COMMUNES_UNPAGINATED_MAX,
} from "@/lib/prospect-communes/types";

// PostgREST filter builder — typed loosely because prospect_communes is not yet
// in all generated client paths during incremental rollout.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FilterableQuery = any;

export function applyProspectCommuneFilters(
  query: FilterableQuery,
  params: ProspectCommunesListParams,
): FilterableQuery {
  let next = query;

  if (params.q) {
    next = next.ilike("commune", `%${params.q}%`);
  }

  if (params.maire) {
    next = next.ilike("maire", `%${params.maire}%`);
  }

  const populationOr = buildPopulationOrFilter(params.populationBuckets);
  if (populationOr) {
    next = next.or(populationOr);
  }

  if (params.popMin !== undefined) {
    next = next.gte("population", params.popMin);
  }
  if (params.popMax !== undefined) {
    next = next.lte("population", params.popMax);
  }

  if (params.cp) {
    next = next.ilike("postcode", `${params.cp}%`);
  }

  if (params.openingDays.length > 0) {
    next = next.overlaps("opening_days", params.openingDays);
  }

  if (params.departments.length === 1) {
    next = next.eq("departement", params.departments[0]);
  } else if (params.departments.length > 1) {
    next = next.in("departement", params.departments);
  }

  if (params.distMin !== undefined) {
    next = next.gte("distance_km", params.distMin);
  }
  if (params.distMax !== undefined) {
    next = next.lte("distance_km", params.distMax);
  }

  if (params.hasEmail === "yes") {
    next = next.not("emails", "eq", "{}");
  } else if (params.hasEmail === "no") {
    next = next.eq("emails", "{}");
  }

  if (params.hasHoraires === "yes") {
    next = next.not("horaires_ouverture", "is", null).neq("horaires_ouverture", "");
  } else if (params.hasHoraires === "no") {
    next = next.or("horaires_ouverture.is.null,horaires_ouverture.eq.");
  }

  if (params.bbox) {
    next = next
      .gte("latitude", params.bbox.south)
      .lte("latitude", params.bbox.north)
      .gte("longitude", params.bbox.west)
      .lte("longitude", params.bbox.east)
      .not("latitude", "is", null)
      .not("longitude", "is", null);
  }

  return next;
}

function mapListRow(row: Record<string, unknown>): ProspectCommuneListItem {
  return {
    id: String(row.id),
    commune: String(row.commune),
    departement: String(row.departement),
    population: Number(row.population),
    distance_km: row.distance_km == null ? null : Number(row.distance_km),
    maire: row.maire == null ? null : String(row.maire),
    nombre_elus: row.nombre_elus == null ? null : Number(row.nombre_elus),
    adresse_mairie: String(row.adresse_mairie),
    postcode: row.postcode == null ? null : String(row.postcode),
    latitude: row.latitude == null ? null : Number(row.latitude),
    longitude: row.longitude == null ? null : Number(row.longitude),
    geocode_source: row.geocode_source as ProspectCommuneListItem["geocode_source"],
    telephones: (row.telephones as string[]) ?? [],
    emails: (row.emails as string[]) ?? [],
    horaires_ouverture:
      row.horaires_ouverture == null ? null : String(row.horaires_ouverture),
    opening_days: (row.opening_days as string[]) ?? [],
    insee_code: row.insee_code == null ? null : String(row.insee_code),
  };
}

export async function countProspectCommunes(
  supabase: SupabaseClient,
  params: ProspectCommunesListParams,
): Promise<number> {
  let query = supabase.from("prospect_communes").select("id", {
    count: "exact",
    head: true,
  });
  query = applyProspectCommuneFilters(query, params);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export async function listProspectCommunes(
  supabase: SupabaseClient,
  params: ProspectCommunesListParams,
): Promise<{ items: ProspectCommuneListItem[]; truncated: boolean }> {
  let query = supabase
    .from("prospect_communes")
    .select(PROSPECT_COMMUNE_LIST_SELECT)
    .order("commune", { ascending: true })
    .limit(PROSPECT_COMMUNES_UNPAGINATED_MAX + 1);
  query = applyProspectCommuneFilters(query, params);

  const { data, error } = await query;
  if (error) throw error;

  const rows = data ?? [];
  const truncated = rows.length > PROSPECT_COMMUNES_UNPAGINATED_MAX;
  const items = (truncated ? rows.slice(0, PROSPECT_COMMUNES_UNPAGINATED_MAX) : rows).map(
    (row) => mapListRow(row as Record<string, unknown>),
  );

  return { items, truncated };
}

export async function getProspectCommuneById(
  supabase: SupabaseClient,
  id: string,
): Promise<ProspectCommuneDetail | null> {
  const { data, error } = await supabase
    .from("prospect_communes")
    .select(`${PROSPECT_COMMUNE_LIST_SELECT}, conseillers`)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const base = mapListRow(data as Record<string, unknown>);
  return {
    ...base,
    conseillers: (data.conseillers as ProspectCommuneDetail["conseillers"]) ?? [],
  };
}

export function countWithoutCoordinates(items: ProspectCommuneListItem[]): number {
  return items.filter(
    (item) =>
      item.latitude == null ||
      item.longitude == null ||
      item.geocode_source === "failed",
  ).length;
}

export function itemsWithCoordinates(
  items: ProspectCommuneListItem[],
): ProspectCommuneListItem[] {
  return items.filter(
    (item) =>
      item.latitude != null &&
      item.longitude != null &&
      item.geocode_source !== "failed",
  );
}
