/**
 * Integration tests for the notification fanout RPC.
 *
 * Tests the `select_content_notification_recipients` RPC with a large commune
 * (1200 members, 100 opted-out) to verify:
 * - No 414 URI Too Long error (the old .in() bug)
 * - No max_rows truncation
 * - Correct opt-out filtering
 *
 * This test creates memberships and profiles directly via service-role SQL
 * rather than creating 1200 auth users, which would be too slow. Only a few
 * real auth users are created for FK constraints.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

const INSEE_FANOUT = "99003";
const EMAIL_DOMAIN = "fanout-test.integration.test";
const PASSWORD = "IntegrationTest2026!";

const TOTAL_MEMBERS = 1200;
const OPTED_OUT_COUNT = 100;

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
let communeId: string;
let authorUserId: string;
const allUserIds: string[] = [];

async function createTestCommune(): Promise<string> {
  const { data, error } = await service
    .from("communes")
    .insert({
      insee_code: INSEE_FANOUT,
      name: "Commune Fanout Test",
      postcode: INSEE_FANOUT,
      department: "Test",
      access_status: "active",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`createTestCommune: ${error?.message ?? "no row"}`);
  }
  return data.id;
}

async function createAuthUser(index: number): Promise<string> {
  const email = `fanout-${index}@${EMAIL_DOMAIN}`;
  const { data, error } = await service.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: {
      first_name: `Fanout${index}`,
      last_name: "Test",
      display_name: `Fanout${index} Test`,
    },
  });

  if (error || !data.user) {
    throw new Error(`createAuthUser(${index}): ${error?.message ?? "no user"}`);
  }
  return data.user.id;
}

async function createBulkMemberships(
  userIds: string[],
  targetCommuneId: string,
): Promise<void> {
  const rows = userIds.map((userId) => ({
    user_id: userId,
    commune_id: targetCommuneId,
    address_city: "Fanout Test City",
    address_citycode: INSEE_FANOUT,
    is_primary: true,
    status: "active" as const,
  }));

  // Insert in batches to avoid hitting PostgREST limits
  const BATCH_SIZE = 100;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await service.from("memberships").insert(batch);
    if (error) {
      throw new Error(`createBulkMemberships batch ${i}: ${error.message}`);
    }
  }
}

async function createOptOutPreferences(userIds: string[]): Promise<void> {
  const rows = userIds.map((userId) => ({
    user_id: userId,
    notify_new_announcement: false,
    notify_new_initiative: true,
    notify_new_event: true,
  }));

  const BATCH_SIZE = 100;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await service.from("user_notification_preferences").insert(batch);
    if (error) {
      throw new Error(`createOptOutPreferences batch ${i}: ${error.message}`);
    }
  }
}

async function purgeTestData(): Promise<void> {
  // Delete by commune first
  const { data: communes } = await service
    .from("communes")
    .select("id")
    .eq("insee_code", INSEE_FANOUT);

  const communeIds = (communes ?? []).map((c) => c.id);

  if (communeIds.length > 0) {
    // Delete memberships (notifications are ON DELETE CASCADE from user)
    await service.from("memberships").delete().in("commune_id", communeIds);
    await service.from("communes").delete().in("id", communeIds);
  }

  // Delete notification preferences for test users
  if (allUserIds.length > 0) {
    // Batch delete to avoid URL length issues
    const BATCH_SIZE = 100;
    for (let i = 0; i < allUserIds.length; i += BATCH_SIZE) {
      const batch = allUserIds.slice(i, i + BATCH_SIZE);
      await service.from("user_notification_preferences").delete().in("user_id", batch);
    }
  }

  // Find and delete auth users
  const perPage = 200;
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`purgeTestData listUsers: ${error.message}`);

    for (const user of data.users) {
      if (user.email?.endsWith(`@${EMAIL_DOMAIN}`)) {
        await service.auth.admin.deleteUser(user.id);
      }
    }
    if (data.users.length < perPage) break;
  }
}

describe("notification fanout RPC — large commune", () => {
  beforeAll(async () => {
    service = createServiceClient();

    // Clean up any leftover data
    await purgeTestData();

    // Create test commune
    communeId = await createTestCommune();

    // Create auth users (triggers profile creation via handle_new_user)
    console.log(`Creating ${TOTAL_MEMBERS} auth users...`);
    const startTime = Date.now();

    // Create users in parallel batches
    const PARALLEL_BATCH = 50;
    for (let i = 0; i < TOTAL_MEMBERS; i += PARALLEL_BATCH) {
      const batch = Array.from(
        { length: Math.min(PARALLEL_BATCH, TOTAL_MEMBERS - i) },
        (_, j) => createAuthUser(i + j),
      );
      const results = await Promise.all(batch);
      allUserIds.push(...results);
    }

    console.log(`Created ${allUserIds.length} users in ${Date.now() - startTime}ms`);

    // First user is the author
    authorUserId = allUserIds[0];

    // Create memberships for all users
    console.log("Creating memberships...");
    await createBulkMemberships(allUserIds, communeId);

    // Mark first 100 non-author users as opted-out
    const optedOutUserIds = allUserIds.slice(1, 1 + OPTED_OUT_COUNT);
    console.log(`Creating ${optedOutUserIds.length} opt-out preferences...`);
    await createOptOutPreferences(optedOutUserIds);

    console.log("Setup complete");
  }, 300_000); // 5 minute timeout for setup

  afterAll(async () => {
    console.log("Cleaning up test data...");
    await purgeTestData();
  }, 120_000);

  it("returns exactly (TOTAL_MEMBERS - 1 - OPTED_OUT_COUNT) recipients for announcement", async () => {
    // Expected: all members minus author minus opted-out
    const expectedCount = TOTAL_MEMBERS - 1 - OPTED_OUT_COUNT;

    // Paginate through all results
    let afterUserId = "00000000-0000-0000-0000-000000000000";
    let totalRecipients = 0;
    const PAGE_SIZE = 150;
    let pageCount = 0;

    while (true) {
      const result = await service.rpc("select_content_notification_recipients", {
        p_commune_id: communeId,
        p_context_type: "announcement",
        p_author_user_id: authorUserId,
        p_exclude_user_ids: [] as string[],
        p_after_user_id: afterUserId,
        p_limit: PAGE_SIZE,
      });

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();

      const pageUsers = result.data ?? [];
      totalRecipients += pageUsers.length;
      pageCount++;

      if (pageUsers.length < PAGE_SIZE) {
        break;
      }

      afterUserId = pageUsers[pageUsers.length - 1].user_id;
    }

    console.log(
      `Fetched ${totalRecipients} recipients across ${pageCount} pages, expected ${expectedCount}`,
    );

    expect(totalRecipients).toBe(expectedCount);
  });

  it("returns all non-author members for initiative (different opt-out column)", async () => {
    // Initiatives use notify_new_initiative, which is true for all test users
    const expectedCount = TOTAL_MEMBERS - 1; // all except author

    let afterUserId = "00000000-0000-0000-0000-000000000000";
    let totalRecipients = 0;
    const PAGE_SIZE = 150;

    while (true) {
      const result = await service.rpc("select_content_notification_recipients", {
        p_commune_id: communeId,
        p_context_type: "initiative",
        p_author_user_id: authorUserId,
        p_exclude_user_ids: [] as string[],
        p_after_user_id: afterUserId,
        p_limit: PAGE_SIZE,
      });

      expect(result.error).toBeNull();
      const pageUsers = result.data ?? [];
      totalRecipients += pageUsers.length;

      if (pageUsers.length < PAGE_SIZE) break;
      afterUserId = pageUsers[pageUsers.length - 1].user_id;
    }

    expect(totalRecipients).toBe(expectedCount);
  });

  it("respects excludeUserIds parameter", async () => {
    // Exclude some specific users
    const excludeIds = allUserIds.slice(200, 210); // 10 users

    let afterUserId = "00000000-0000-0000-0000-000000000000";
    let totalRecipients = 0;
    const PAGE_SIZE = 150;

    while (true) {
      const result = await service.rpc("select_content_notification_recipients", {
        p_commune_id: communeId,
        p_context_type: "initiative",
        p_author_user_id: authorUserId,
        p_exclude_user_ids: excludeIds,
        p_after_user_id: afterUserId,
        p_limit: PAGE_SIZE,
      });

      expect(result.error).toBeNull();
      const pageUsers = result.data ?? [];
      totalRecipients += pageUsers.length;

      if (pageUsers.length < PAGE_SIZE) break;
      afterUserId = pageUsers[pageUsers.length - 1].user_id;
    }

    // Expected: all minus author minus excluded
    const expectedCount = TOTAL_MEMBERS - 1 - excludeIds.length;
    expect(totalRecipients).toBe(expectedCount);
  });

  it("does not suffer from 414 URI Too Long (no .in() on large arrays)", async () => {
    // This test verifies we can query without hitting URL limits
    // The RPC uses joins, not .in(), so it shouldn't fail
    const { data, error } = await service.rpc("select_content_notification_recipients", {
      p_commune_id: communeId,
      p_context_type: "announcement",
      p_author_user_id: authorUserId,
      p_exclude_user_ids: [],
      p_after_user_id: "00000000-0000-0000-0000-000000000000",
      p_limit: 150,
    });

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it("returns ordered results for stable pagination", async () => {
    const { data, error } = await service.rpc("select_content_notification_recipients", {
      p_commune_id: communeId,
      p_context_type: "announcement",
      p_author_user_id: authorUserId,
      p_exclude_user_ids: [],
      p_after_user_id: "00000000-0000-0000-0000-000000000000",
      p_limit: 50,
    });

    expect(error).toBeNull();
    const userIds = (data ?? []).map((r) => r.user_id);

    // Verify ordering (UUIDs should be lexicographically ordered)
    const sorted = [...userIds].sort();
    expect(userIds).toEqual(sorted);
  });
});
