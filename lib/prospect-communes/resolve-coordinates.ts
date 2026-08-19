import type { GeocodeSource } from "@/lib/prospect-communes/types";

const BAN_BASE =
  process.env.NEXT_PUBLIC_BAN_API_URL ?? "https://api-adresse.data.gouv.fr";

export type ResolveProspectCoordinatesInput = {
  adresse_mairie: string;
  insee_code?: string | null;
  centroid?: { lat: number; lng: number } | null;
  skipGeocoded?: boolean;
  existing?: {
    latitude: number | null;
    longitude: number | null;
    geocode_source: GeocodeSource | null;
  };
  /** Rate-limit BAN calls during batch import. */
  banDelayMs?: number;
};

export type ResolveProspectCoordinatesResult = {
  latitude: number | null;
  longitude: number | null;
  geocode_source: GeocodeSource;
  insee_code: string | null;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function geocodeBanAddress(
  address: string,
): Promise<{ lat: number; lng: number } | null> {
  const url = new URL(`${BAN_BASE}/search/`);
  url.searchParams.set("q", address);
  url.searchParams.set("limit", "1");
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const body = (await res.json()) as {
    features?: Array<{ geometry: { coordinates: [number, number] } }>;
  };
  const coords = body.features?.[0]?.geometry.coordinates;
  if (!coords) return null;
  const [lng, lat] = coords;
  return { lat, lng };
}

export async function resolveProspectCoordinates(
  input: ResolveProspectCoordinatesInput,
): Promise<ResolveProspectCoordinatesResult> {
  const insee_code = input.insee_code ?? null;

  if (
    input.skipGeocoded &&
    input.existing?.latitude != null &&
    input.existing.longitude != null &&
    input.existing.geocode_source &&
    input.existing.geocode_source !== "failed"
  ) {
    return {
      latitude: input.existing.latitude,
      longitude: input.existing.longitude,
      geocode_source: input.existing.geocode_source,
      insee_code,
    };
  }

  if (input.banDelayMs && input.banDelayMs > 0) {
    await sleep(input.banDelayMs);
  }

  const ban = await geocodeBanAddress(input.adresse_mairie);
  if (ban) {
    return {
      latitude: ban.lat,
      longitude: ban.lng,
      geocode_source: "ban",
      insee_code,
    };
  }

  if (input.centroid) {
    return {
      latitude: input.centroid.lat,
      longitude: input.centroid.lng,
      geocode_source: "centroid",
      insee_code,
    };
  }

  return {
    latitude: null,
    longitude: null,
    geocode_source: "failed",
    insee_code,
  };
}
