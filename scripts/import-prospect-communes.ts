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
 *
 * Does NOT upsert prospect_outreach — outreach rows are created by DB trigger.
 */
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { extractPostcode } from "@/lib/prospect-communes/extract-postcode";
import { fetchGeoCommuneByName } from "@/lib/prospect-communes/geo-commune";
import { parseOpeningDays } from "@/lib/prospect-communes/parse-opening-days";
import { resolveProspectCoordinates } from "@/lib/prospect-communes/resolve-coordinates";
import type {
  GeocodeSource,
  ProspectCommuneImportRow,
} from "@/lib/prospect-communes/types";

const BATCH_SIZE = 50;
const BAN_DELAY_MS = 200;

type ImportStats = {
  ban: number;
  centroid: number;
  failed: number;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
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

    const geo = await fetchGeoCommuneByName(row.commune, row.departement);
    const centroidCoords = geo?.centre?.coordinates;
    const centroid = centroidCoords
      ? { lat: centroidCoords[1], lng: centroidCoords[0] }
      : null;

    const coords = await resolveProspectCoordinates({
      adresse_mairie: row.adresse_mairie,
      insee_code: geo?.code ?? null,
      centroid,
      skipGeocoded,
      existing: existing
        ? {
            latitude: existing.latitude,
            longitude: existing.longitude,
            geocode_source: existing.geocode_source as GeocodeSource,
          }
        : undefined,
      banDelayMs: BAN_DELAY_MS,
    });

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
