#!/usr/bin/env tsx
/**
 * Import prospect communes JSON into Supabase with BAN geocoding.
 *
 * Usage:
 *   npm run import-prospect-communes
 *   npx tsx --env-file=.env.local scripts/import-prospect-communes.ts docs/data/communes.json
 *   npx tsx --env-file=.env.local scripts/import-prospect-communes.ts docs/data/communes.json --skip-geocoded
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { extractPostcode } from "@/lib/prospect-communes/extract-postcode";
import { parseOpeningDays } from "@/lib/prospect-communes/parse-opening-days";
import type {
  GeocodeSource,
  ProspectCommuneImportRow,
} from "@/lib/prospect-communes/types";

const BAN_BASE = "https://api-adresse.data.gouv.fr";
const GEO_BASE = "https://geo.api.gouv.fr";
const BATCH_SIZE = 50;
const BAN_DELAY_MS = 200;

type GeoCommune = {
  nom: string;
  code: string;
  centre?: { coordinates: [number, number] };
};

type ImportStats = {
  ban: number;
  centroid: number;
  failed: number;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

async function fetchGeoCommune(
  commune: string,
  departement: string,
): Promise<GeoCommune | null> {
  const params = new URLSearchParams({
    nom: commune,
    codeDepartement: departement,
    fields: "nom,code,centre",
    format: "json",
    geometry: "centre",
    limit: "5",
  });
  const res = await fetch(`${GEO_BASE}/communes?${params}`);
  if (!res.ok) return null;
  const data = (await res.json()) as GeoCommune[];
  const exact =
    data.find((entry) => entry.nom.toLowerCase() === commune.toLowerCase()) ??
    data[0];
  return exact ?? null;
}

async function geocodeBan(
  address: string,
): Promise<{ lat: number; lng: number } | null> {
  const url = new URL(`${BAN_BASE}/search/`);
  url.searchParams.set("q", address);
  url.searchParams.set("limit", "1");
  const res = await fetch(url);
  if (!res.ok) return null;
  const body = (await res.json()) as {
    features?: Array<{ geometry: { coordinates: [number, number] } }>;
  };
  const coords = body.features?.[0]?.geometry.coordinates;
  if (!coords) return null;
  const [lng, lat] = coords;
  return { lat, lng };
}

async function resolveCoordinates(
  row: ProspectCommuneImportRow,
  skipGeocoded: boolean,
  existing?: {
    latitude: number | null;
    longitude: number | null;
    geocode_source: GeocodeSource | null;
  },
): Promise<{
  latitude: number | null;
  longitude: number | null;
  geocode_source: GeocodeSource;
  insee_code: string | null;
}> {
  const geo = await fetchGeoCommune(row.commune, row.departement);
  const insee_code = geo?.code ?? null;

  if (
    skipGeocoded &&
    existing?.latitude != null &&
    existing.longitude != null &&
    existing.geocode_source &&
    existing.geocode_source !== "failed"
  ) {
    return {
      latitude: existing.latitude,
      longitude: existing.longitude,
      geocode_source: existing.geocode_source,
      insee_code,
    };
  }

  await sleep(BAN_DELAY_MS);
  const ban = await geocodeBan(row.adresse_mairie);
  if (ban) {
    return {
      latitude: ban.lat,
      longitude: ban.lng,
      geocode_source: "ban",
      insee_code,
    };
  }

  const centroid = geo?.centre?.coordinates;
  if (centroid) {
    const [lng, lat] = centroid;
    return {
      latitude: lat,
      longitude: lng,
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

async function main() {
  const jsonPath = process.argv[2];
  const skipGeocoded = process.argv.includes("--skip-geocoded");

  if (!jsonPath) {
    console.error("Usage: npx tsx scripts/import-prospect-communes.ts <path-to-json> [--skip-geocoded]");
    process.exit(1);
  }

  const rows = JSON.parse(readFileSync(jsonPath, "utf8")) as ProspectCommuneImportRow[];
  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const importBatchId = randomUUID();
  const stats: ImportStats = { ban: 0, centroid: 0, failed: 0 };
  const payload: Record<string, unknown>[] = [];

  for (const row of rows) {
    const { data: existing } = await supabase
      .from("prospect_communes")
      .select("latitude, longitude, geocode_source")
      .eq("commune", row.commune)
      .eq("departement", row.departement)
      .maybeSingle();

    const coords = await resolveCoordinates(
      row,
      skipGeocoded,
      existing
        ? {
            latitude: existing.latitude,
            longitude: existing.longitude,
            geocode_source: existing.geocode_source as GeocodeSource,
          }
        : undefined,
    );

    stats[coords.geocode_source] += 1;

    payload.push({
      commune: row.commune,
      departement: row.departement,
      population: row.population,
      distance_km: row.distance_km,
      maire: row.maire,
      conseillers: row.conseillers,
      nombre_elus: row.nombre_elus,
      adresse_mairie: row.adresse_mairie,
      postcode: extractPostcode(row.adresse_mairie),
      latitude: coords.latitude,
      longitude: coords.longitude,
      geocode_source: coords.geocode_source,
      telephones: row.telephones ?? [],
      emails: row.emails ?? [],
      horaires_ouverture: row.horaires_ouverture || null,
      opening_days: parseOpeningDays(row.horaires_ouverture),
      insee_code: coords.insee_code,
      import_batch_id: importBatchId,
      source_imported_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  for (let index = 0; index < payload.length; index += BATCH_SIZE) {
    const chunk = payload.slice(index, index + BATCH_SIZE);
    const { error } = await supabase
      .from("prospect_communes")
      .upsert(chunk, { onConflict: "commune,departement" });
    if (error) {
      console.error("Upsert failed:", error.message);
      process.exit(1);
    }
    console.log(`Upserted ${Math.min(index + BATCH_SIZE, payload.length)} / ${payload.length}`);
  }

  console.log(JSON.stringify({ total: rows.length, ...stats, importBatchId }, null, 2));
  if (stats.failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
