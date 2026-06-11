#!/usr/bin/env tsx
/**
 * Optional one-shot import of French communes from geo.api.gouv.fr into Supabase.
 * Not executed on `supabase db reset` — run manually when needed.
 * Usage: SUPABASE_SERVICE_ROLE_KEY=... NEXT_PUBLIC_SUPABASE_URL=... npx tsx scripts/import-communes.ts
 */
import { createClient } from "@supabase/supabase-js";

const BATCH = 500;

type GeoCommune = {
  code: string;
  nom: string;
  codesPostaux: string[];
  codeDepartement: string;
  centre: { coordinates: [number, number] };
};

async function fetchCommunes(): Promise<GeoCommune[]> {
  const res = await fetch(
    "https://geo.api.gouv.fr/communes?fields=code,nom,codesPostaux,codeDepartement,centre&format=json&geometry=centre",
  );
  if (!res.ok) throw new Error(`geo.api.gouv.fr: ${res.status}`);
  return res.json();
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const communes = await fetchCommunes();
  console.log(`Importing ${communes.length} communes…`);

  for (let i = 0; i < communes.length; i += BATCH) {
    const slice = communes.slice(i, i + BATCH).map((c) => ({
      insee_code: c.code,
      name: c.nom,
      postcode: c.codesPostaux[0] ?? null,
      department: c.codeDepartement,
      centroid_lng: c.centre.coordinates[0],
      centroid_lat: c.centre.coordinates[1],
      subscription_status: "inactive" as const,
    }));

    const { error } = await supabase.from("communes").upsert(slice, {
      onConflict: "insee_code",
    });
    if (error) throw error;
    console.log(`  ${Math.min(i + BATCH, communes.length)} / ${communes.length}`);
  }

  console.log("Done. Les Authieux is seeded via supabase/seed.sql on db reset.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
