/**
 * Integration tests for event engagement companions (`guests_count`):
 * - upsert on (event_id, membership_id) updates the count without duplicates,
 * - the CHECK constraint rejects out-of-range values,
 * - a member cannot edit another member's registration (UPDATE policy),
 * - `count_event_participation` returns headcount = rows + sum(guests_count).
 *
 * Runs against the local Supabase stack only (see requireLocalSupabaseUrl).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { MAX_EVENT_GUESTS } from "@/lib/constants/event-guests";

const INSEE = "99006";
const EMAIL_DOMAIN = "event-guests.integration.test";
const PASSWORD = "IntegrationTest2026!";

type ServiceClient = SupabaseClient<Database>;
type UserClient = SupabaseClient<Database>;

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
        "Cette suite crée et supprime des données : elle ne doit viser que le Supabase local.",
    );
  }
  return url;
}

function createServiceClient(): ServiceClient {
  return createClient<Database>(requireLocalSupabaseUrl(), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function createUserClient(email: string): Promise<UserClient> {
  const client = createClient<Database>(
    requireLocalSupabaseUrl(),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(`signIn(${email}): ${error.message}`);
  return client;
}

let service: ServiceClient;
let communeId: string;
let authorMembershipId: string;
let marieMembershipId: string;
let paulMembershipId: string;
let eventId: string;
let marieClient: UserClient;
let paulClient: UserClient;

const AUTHOR_EMAIL = `author@${EMAIL_DOMAIN}`;
const MARIE_EMAIL = `marie@${EMAIL_DOMAIN}`;
const PAUL_EMAIL = `paul@${EMAIL_DOMAIN}`;

async function createAuthUser(email: string, firstName: string): Promise<string> {
  const { data, error } = await service.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: "Test", display_name: `${firstName} Test` },
  });
  if (error || !data.user) throw new Error(`createAuthUser(${email}): ${error?.message}`);
  return data.user.id;
}

async function createMembership(userId: string): Promise<string> {
  const { data, error } = await service
    .from("memberships")
    .insert({
      user_id: userId,
      commune_id: communeId,
      address_city: "Guests Test City",
      address_citycode: INSEE,
      is_primary: true,
      status: "active",
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(`createMembership: ${error?.message ?? "no row"}`);
  return data.id;
}

async function purgeTestData(): Promise<void> {
  const { data: communes } = await service.from("communes").select("id").eq("insee_code", INSEE);
  const ids = (communes ?? []).map((c) => c.id);
  if (ids.length > 0) await service.from("communes").delete().in("id", ids);

  const { data } = await service.auth.admin.listUsers({ page: 1, perPage: 200 });
  for (const user of data?.users ?? []) {
    if (user.email?.endsWith(`@${EMAIL_DOMAIN}`)) {
      await service.auth.admin.deleteUser(user.id);
    }
  }
}

async function counts() {
  const { data, error } = await service.rpc("count_event_participation", {
    p_event_ids: [eventId],
  });
  if (error || !data?.[0]) throw new Error(`count_event_participation: ${error?.message}`);
  return data[0];
}

describe("event engagement guests — upsert, constraints, headcount RPC", () => {
  beforeAll(async () => {
    service = createServiceClient();
    await purgeTestData();

    const { data: commune, error } = await service
      .from("communes")
      .insert({ insee_code: INSEE, name: "Commune Guests", postcode: INSEE, department: "Test", access_status: "active" })
      .select("id")
      .single();
    if (error || !commune) throw new Error(`createCommune: ${error?.message}`);
    communeId = commune.id;

    const [authorUserId, marieUserId, paulUserId] = await Promise.all([
      createAuthUser(AUTHOR_EMAIL, "Author"),
      createAuthUser(MARIE_EMAIL, "Marie"),
      createAuthUser(PAUL_EMAIL, "Paul"),
    ]);
    authorMembershipId = await createMembership(authorUserId);
    marieMembershipId = await createMembership(marieUserId);
    paulMembershipId = await createMembership(paulUserId);

    const starts = new Date(Date.now() + 7 * 86_400_000).toISOString();
    const ends = new Date(Date.now() + 7 * 86_400_000 + 3_600_000).toISOString();
    const { data: event, error: eventError } = await service
      .from("events")
      .insert({
        commune_id: communeId,
        author_membership_id: authorMembershipId,
        title: "Fête des voisins",
        starts_at: starts,
        ends_at: ends,
        volunteers_needed: 5,
      })
      .select("id")
      .single();
    if (eventError || !event) throw new Error(`createEvent: ${eventError?.message}`);
    eventId = event.id;

    marieClient = await createUserClient(MARIE_EMAIL);
    paulClient = await createUserClient(PAUL_EMAIL);
  });

  afterAll(async () => {
    await marieClient?.auth.signOut();
    await paulClient?.auth.signOut();
    await purgeTestData();
  });

  it("upserts the registration and updates guests_count without duplicates", async () => {
    const first = await marieClient
      .from("event_participants")
      .upsert(
        { event_id: eventId, membership_id: marieMembershipId, guests_count: 0 },
        { onConflict: "event_id,membership_id" },
      );
    expect(first.error).toBeNull();

    const second = await marieClient
      .from("event_participants")
      .upsert(
        { event_id: eventId, membership_id: marieMembershipId, guests_count: 3 },
        { onConflict: "event_id,membership_id" },
      );
    expect(second.error).toBeNull();

    const { data: rows } = await service
      .from("event_participants")
      .select("guests_count")
      .eq("event_id", eventId)
      .eq("membership_id", marieMembershipId);
    expect(rows).toHaveLength(1);
    expect(rows?.[0].guests_count).toBe(3);
  });

  it("rejects guests_count outside [0, MAX_EVENT_GUESTS]", async () => {
    const tooMany = await marieClient
      .from("event_participants")
      .upsert(
        { event_id: eventId, membership_id: marieMembershipId, guests_count: MAX_EVENT_GUESTS + 1 },
        { onConflict: "event_id,membership_id" },
      );
    expect(tooMany.error).not.toBeNull();

    const negative = await marieClient
      .from("event_volunteers")
      .insert({ event_id: eventId, membership_id: marieMembershipId, guests_count: -1 });
    expect(negative.error).not.toBeNull();
  });

  it("does not let a member edit another member's registration", async () => {
    // RLS filters the row away: no error, but zero rows affected.
    const { data } = await paulClient
      .from("event_participants")
      .update({ guests_count: 9 })
      .eq("event_id", eventId)
      .eq("membership_id", marieMembershipId)
      .select("guests_count");
    expect(data ?? []).toHaveLength(0);

    const { data: still } = await service
      .from("event_participants")
      .select("guests_count")
      .eq("event_id", eventId)
      .eq("membership_id", marieMembershipId)
      .single();
    expect(still?.guests_count).toBe(3);
  });

  it("reports headcount = registrations + companions for both kinds", async () => {
    // Participants: Marie (+3) and Paul (+0) → 2 rows, 5 people.
    const paul = await paulClient
      .from("event_participants")
      .insert({ event_id: eventId, membership_id: paulMembershipId });
    expect(paul.error).toBeNull();

    // Volunteers: Paul (+1) → 1 row, 2 people.
    const paulVolunteer = await paulClient
      .from("event_volunteers")
      .insert({ event_id: eventId, membership_id: paulMembershipId, guests_count: 1 });
    expect(paulVolunteer.error).toBeNull();

    const row = await counts();
    expect(Number(row.participants_count)).toBe(2);
    expect(Number(row.participants_headcount)).toBe(5);
    expect(Number(row.volunteers_count)).toBe(1);
    expect(Number(row.volunteers_headcount)).toBe(2);
  });

  it("drops the registration and its companions on cancel", async () => {
    const { error } = await marieClient
      .from("event_participants")
      .delete()
      .eq("event_id", eventId)
      .eq("membership_id", marieMembershipId);
    expect(error).toBeNull();

    const row = await counts();
    expect(Number(row.participants_count)).toBe(1);
    expect(Number(row.participants_headcount)).toBe(1);
  });
});
