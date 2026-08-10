/**
 * Integration tests for the backoffice user list RPC.
 *
 * Verifies:
 * - Membership filters apply to the same membership row (no cross-commune intersection)
 * - total_count stays accurate beyond PostgREST max_rows (1000)
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

const INSEE_X = "99004";
const INSEE_Y = "99005";
const INSEE_BULK = "99006";
const EMAIL_DOMAIN = "backoffice-users-list.integration.test";
const PASSWORD = "IntegrationTest2026!";
const BULK_MEMBERS = 1001;

type ServiceClient = SupabaseClient<Database>;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name}. Start the local stack with \`npx supabase start\` and ` +
        "fill .env.local from `npx supabase status -o env`.",
    );
  }
  return value;
}

function requireLocalSupabaseUrl(): string {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const { hostname } = new URL(url);

  if (hostname !== "127.0.0.1" && hostname !== "localhost") {
    throw new Error(
      `Refus d'exécuter la suite d'intégration contre ${hostname}. ` +
        "Cette suite crée et supprime des données : elle ne " +
        "doit viser que le Supabase local (npx supabase start).",
    );
  }

  return url;
}

function createServiceClient(): ServiceClient {
  return createClient<Database>(
    requireLocalSupabaseUrl(),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

let service: ServiceClient;
let communeXId: string;
let communeYId: string;
let bulkCommuneId: string;
let crossCommuneUserId: string;
const bulkUserIds: string[] = [];

async function createCommune(inseeCode: string, name: string): Promise<string> {
  const { data, error } = await service
    .from("communes")
    .insert({
      insee_code: inseeCode,
      name,
      postcode: inseeCode,
      department: "Test",
      access_status: "active",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`createCommune(${inseeCode}): ${error?.message ?? "no row"}`);
  }
  return data.id;
}

async function createAuthUser(label: string): Promise<string> {
  const email = `${label}@${EMAIL_DOMAIN}`;
  const { data, error } = await service.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: {
      first_name: label,
      last_name: "Test",
      display_name: `${label} Test`,
    },
  });

  if (error || !data.user) {
    throw new Error(`createAuthUser(${label}): ${error?.message ?? "no user"}`);
  }
  return data.user.id;
}

async function createMembership(
  userId: string,
  communeId: string,
  role: "member" | "staff" | "mayor",
  status: "active" | "suspended" | "left" = "active",
): Promise<void> {
  const { error } = await service.from("memberships").insert({
    user_id: userId,
    commune_id: communeId,
    address_city: "Test City",
    address_citycode: INSEE_X,
    is_primary: true,
    role,
    status,
  });

  if (error) {
    throw new Error(`createMembership: ${error.message}`);
  }
}

async function purgeTestData(): Promise<void> {
  const inseeCodes = [INSEE_X, INSEE_Y, INSEE_BULK];

  const { data: communes } = await service
    .from("communes")
    .select("id")
    .in("insee_code", inseeCodes);

  const communeIds = (communes ?? []).map((row) => row.id);
  if (communeIds.length > 0) {
    await service.from("memberships").delete().in("commune_id", communeIds);
    await service.from("communes").delete().in("id", communeIds);
  }

  const { data: users } = await service.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  for (const user of users.users ?? []) {
    if (user.email?.endsWith(`@${EMAIL_DOMAIN}`)) {
      await service.auth.admin.deleteUser(user.id);
    }
  }
}

describe("backoffice user list RPC", () => {
  beforeAll(async () => {
    service = createServiceClient();
    await purgeTestData();

    [communeXId, communeYId, bulkCommuneId] = await Promise.all([
      createCommune(INSEE_X, "Commune Users X"),
      createCommune(INSEE_Y, "Commune Users Y"),
      createCommune(INSEE_BULK, "Commune Users Bulk"),
    ]);

    crossCommuneUserId = await createAuthUser("cross-commune");
    await createMembership(crossCommuneUserId, communeXId, "member", "active");
    await createMembership(crossCommuneUserId, communeYId, "mayor", "active");

    for (let i = 0; i < BULK_MEMBERS; i += 1) {
      const userId = await createAuthUser(`bulk-${i}`);
      bulkUserIds.push(userId);
    }

    const membershipRows = bulkUserIds.map((userId) => ({
      user_id: userId,
      commune_id: bulkCommuneId,
      address_city: "Bulk City",
      address_citycode: INSEE_BULK,
      is_primary: true,
      status: "active" as const,
    }));

    const BATCH_SIZE = 100;
    for (let i = 0; i < membershipRows.length; i += BATCH_SIZE) {
      const batch = membershipRows.slice(i, i + BATCH_SIZE);
      const { error } = await service.from("memberships").insert(batch);
      if (error) {
        throw new Error(`bulk memberships insert: ${error.message}`);
      }
    }
  }, 120_000);

  afterAll(async () => {
    if (service) await purgeTestData();
  }, 120_000);

  it("does not match cross-commune role intersection", async () => {
    const { data, error } = await service.rpc("list_filtered_users_page", {
      p_commune_id: communeXId,
      p_role: "mayor",
      p_limit: 50,
      p_offset: 0,
    });

    expect(error).toBeNull();
    const userIds = (data ?? []).map((row) => row.user_id);
    expect(userIds).not.toContain(crossCommuneUserId);
  });

  it("returns total_count beyond max_rows for membership status filter", async () => {
    const { data, error } = await service.rpc("list_filtered_users_page", {
      p_commune_id: bulkCommuneId,
      p_membership_status: "active",
      p_limit: 1,
      p_offset: 0,
    });

    expect(error).toBeNull();
    expect(data?.[0]?.total_count ?? 0).toBeGreaterThanOrEqual(BULK_MEMBERS);
  });
});
