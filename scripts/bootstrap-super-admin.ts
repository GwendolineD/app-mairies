#!/usr/bin/env tsx
/**
 * One-shot production bootstrap: pilot commune + platform super admin.
 *
 * Usage (local or prod):
 *   BOOTSTRAP_ADMIN_PASSWORD='your-password' npm run bootstrap-super-admin
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * (from .env.local locally, or prod env vars).
 */
import { createClient } from "@supabase/supabase-js";

const COMMUNE = {
  inseeCode: "27027",
  name: "Les Authieux",
  postcode: "27220",
  department: "Eure",
  centroidLat: 48.8978,
  centroidLng: 1.2338,
  welcomeMessage:
    "Bienvenue sur Vie Locale Les Authieux — découvrir, partager, s'entraider.",
} as const;

const ADMIN = {
  email: "dubois.gwendoline@hotmail.fr",
  firstName: "Gwendoline",
  lastName: "DUBOIS",
  displayName: "Gwendoline D.",
  addressStreet: "7 bis rue de la forêt du parc",
  addressCity: "Les Authieux",
  addressPostcode: "27220",
  addressCitycode: "27027",
} as const;

type BanFeature = {
  geometry: { coordinates: [number, number] };
};

async function geocodeAddress(): Promise<{ lat: number; lng: number }> {
  const query = `${ADMIN.addressStreet} ${ADMIN.addressPostcode} ${ADMIN.addressCity}`;
  const url = new URL("https://api-adresse.data.gouv.fr/search/");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "1");

  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`BAN geocoding failed (${res.status}), using commune centroid`);
    return { lat: COMMUNE.centroidLat, lng: COMMUNE.centroidLng };
  }

  const body = (await res.json()) as { features?: BanFeature[] };
  const coords = body.features?.[0]?.geometry?.coordinates;
  if (!coords) {
    console.warn("BAN returned no result, using commune centroid");
    return { lat: COMMUNE.centroidLat, lng: COMMUNE.centroidLng };
  }

  const [lng, lat] = coords;
  return { lat, lng };
}

async function findUserByEmail(
  supabase: ReturnType<typeof createClient>,
  email: string,
) {
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const match = data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );
    if (match) return match;

    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  if (!url || !serviceRoleKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  if (!password) {
    console.error("Missing BOOTSTRAP_ADMIN_PASSWORD");
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { lat, lng } = await geocodeAddress();

  const { data: commune, error: communeError } = await supabase
    .from("communes")
    .upsert(
      {
        insee_code: COMMUNE.inseeCode,
        name: COMMUNE.name,
        postcode: COMMUNE.postcode,
        department: COMMUNE.department,
        centroid_lat: COMMUNE.centroidLat,
        centroid_lng: COMMUNE.centroidLng,
        access_status: "active",
        settings: { welcomeMessage: COMMUNE.welcomeMessage },
      },
      { onConflict: "insee_code" },
    )
    .select("id")
    .single();

  if (communeError || !commune) {
    console.error("Commune upsert failed:", communeError?.message ?? "no row");
    process.exit(1);
  }

  let userId: string;
  const existingUser = await findUserByEmail(supabase, ADMIN.email);

  if (existingUser) {
    userId = existingUser.id;
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
      user_metadata: {
        first_name: ADMIN.firstName,
        last_name: ADMIN.lastName,
        display_name: ADMIN.displayName,
      },
    });
    if (updateError) {
      console.error("User update failed:", updateError.message);
      process.exit(1);
    }
    console.log(`Updated existing user ${ADMIN.email}`);
  } else {
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: ADMIN.email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: ADMIN.firstName,
        last_name: ADMIN.lastName,
        display_name: ADMIN.displayName,
      },
    });
    if (createError || !created.user) {
      console.error("User creation failed:", createError?.message ?? "no user");
      process.exit(1);
    }
    userId = created.user.id;
    console.log(`Created user ${ADMIN.email}`);
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      user_id: userId,
      first_name: ADMIN.firstName,
      last_name: ADMIN.lastName,
      display_name: ADMIN.displayName,
      active_commune_id: commune.id,
      is_platform_admin: true,
      has_seen_onboarding: true,
    },
    { onConflict: "user_id" },
  );

  if (profileError) {
    console.error("Profile upsert failed:", profileError.message);
    process.exit(1);
  }

  const { error: membershipError } = await supabase.from("memberships").upsert(
    {
      user_id: userId,
      commune_id: commune.id,
      address_street: ADMIN.addressStreet,
      address_city: ADMIN.addressCity,
      address_citycode: ADMIN.addressCitycode,
      address_postcode: ADMIN.addressPostcode,
      address_lat: lat,
      address_lng: lng,
      is_primary: true,
      status: "active",
      role: "member",
    },
    { onConflict: "user_id,commune_id" },
  );

  if (membershipError) {
    console.error("Membership upsert failed:", membershipError.message);
    process.exit(1);
  }

  console.log("Bootstrap complete.");
  console.log(`  Commune: ${COMMUNE.name} (${commune.id})`);
  console.log(`  Admin:   ${ADMIN.email} (${userId})`);
  console.log(`  Address: ${ADMIN.addressStreet}, ${ADMIN.addressPostcode} ${ADMIN.addressCity}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
