/**
 * Integration tests for the notification center schema layer:
 * - `list_my_notifications` resolves the related content status and authorship
 *   and scopes rows to the requested commune.
 * - `count_unread_notifications` is commune-scoped.
 * - Deleting a content row cascades to its notifications (SQL trigger).
 *
 * Runs against the local Supabase stack only (see requireLocalSupabaseUrl).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

const INSEE_A = "99004";
const INSEE_B = "99005";
const EMAIL_DOMAIN = "notif-center.integration.test";
const PASSWORD = "IntegrationTest2026!";
const ANNOUNCEMENT_CATEGORY = "alimentaire";

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
  return createClient<Database>(
    requireLocalSupabaseUrl(),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
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
let communeA: string;
let communeB: string;
let authorUserId: string;
let readerUserId: string;
let authorMembershipA: string;
let readerClient: UserClient;

const AUTHOR_EMAIL = `author@${EMAIL_DOMAIN}`;
const READER_EMAIL = `reader@${EMAIL_DOMAIN}`;

async function createCommune(insee: string, name: string): Promise<string> {
  const { data, error } = await service
    .from("communes")
    .insert({ insee_code: insee, name, postcode: insee, department: "Test", access_status: "active" })
    .select("id")
    .single();
  if (error || !data) throw new Error(`createCommune: ${error?.message ?? "no row"}`);
  return data.id;
}

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

async function createMembership(userId: string, communeId: string, insee: string): Promise<string> {
  const { data, error } = await service
    .from("memberships")
    .insert({
      user_id: userId,
      commune_id: communeId,
      address_city: "Notif Test City",
      address_citycode: insee,
      is_primary: true,
      status: "active",
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(`createMembership: ${error?.message ?? "no row"}`);
  return data.id;
}

async function createAnnouncement(status: Database["public"]["Enums"]["announcement_status"]) {
  const { data, error } = await service
    .from("announcements")
    .insert({
      commune_id: communeA,
      author_membership_id: authorMembershipA,
      type: "demande",
      category_slug: ANNOUNCEMENT_CATEGORY,
      title: `Annonce ${status}`,
      status,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(`createAnnouncement: ${error?.message ?? "no row"}`);
  return data.id;
}

async function insertNotification(input: {
  userId: string;
  communeId: string;
  kind: string;
  contextType?: Database["public"]["Enums"]["context_type"];
  contextId?: string;
  title: string;
  read?: boolean;
}) {
  const { data, error } = await service
    .from("notifications")
    .insert({
      user_id: input.userId,
      commune_id: input.communeId,
      kind: input.kind,
      tag: input.contextType && input.contextId ? `${input.contextType}:${input.contextId}` : null,
      context_type: input.contextType ?? null,
      context_id: input.contextId ?? null,
      title: input.title,
      body: null,
      payload: {},
      read_at: input.read ? new Date().toISOString() : null,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(`insertNotification: ${error?.message ?? "no row"}`);
  return data.id;
}

async function purgeTestData(): Promise<void> {
  const { data: communes } = await service
    .from("communes")
    .select("id")
    .in("insee_code", [INSEE_A, INSEE_B]);
  const communeIds = (communes ?? []).map((c) => c.id);
  if (communeIds.length > 0) {
    // Content tables cascade from communes; notifications cascade from users.
    await service.from("communes").delete().in("id", communeIds);
  }

  const { data } = await service.auth.admin.listUsers({ page: 1, perPage: 200 });
  for (const user of data?.users ?? []) {
    if (user.email?.endsWith(`@${EMAIL_DOMAIN}`)) {
      await service.auth.admin.deleteUser(user.id);
    }
  }
}

describe("notification center — RPCs and cascade trigger", () => {
  beforeAll(async () => {
    service = createServiceClient();
    await purgeTestData();

    communeA = await createCommune(INSEE_A, "Commune Notif A");
    communeB = await createCommune(INSEE_B, "Commune Notif B");

    authorUserId = await createAuthUser(AUTHOR_EMAIL, "Author");
    readerUserId = await createAuthUser(READER_EMAIL, "Reader");

    authorMembershipA = await createMembership(authorUserId, communeA, INSEE_A);
    await createMembership(readerUserId, communeA, INSEE_A);
    await createMembership(readerUserId, communeB, INSEE_B);

    readerClient = await createUserClient(READER_EMAIL);
  });

  afterAll(async () => {
    await readerClient?.auth.signOut();
    await purgeTestData();
  });

  it("resolves context_status and is_author from the related content", async () => {
    const open = await createAnnouncement("ouverte");
    const filled = await createAnnouncement("pourvue");
    const archived = await createAnnouncement("archivee");

    await insertNotification({
      userId: readerUserId, communeId: communeA, kind: "new_content",
      contextType: "announcement", contextId: open, title: "open",
    });
    await insertNotification({
      userId: readerUserId, communeId: communeA, kind: "new_content",
      contextType: "announcement", contextId: filled, title: "filled",
    });
    await insertNotification({
      userId: authorUserId, communeId: communeA, kind: "engagement",
      contextType: "announcement", contextId: archived, title: "archived-author",
    });
    await insertNotification({
      userId: readerUserId, communeId: communeA, kind: "system", title: "system",
    });

    const { data: readerRows, error } = await readerClient.rpc("list_my_notifications", {
      p_commune_id: communeA,
      p_limit: 20,
    });
    expect(error).toBeNull();
    const byTitle = new Map((readerRows ?? []).map((r) => [r.title, r]));

    expect(byTitle.get("open")).toMatchObject({ context_status: "available", is_author: false });
    expect(byTitle.get("filled")).toMatchObject({ context_status: "finished", is_author: false });
    expect(byTitle.get("system")).toMatchObject({ context_status: "available", is_author: false });
    // RLS: the author's row never leaks to the reader.
    expect(byTitle.has("archived-author")).toBe(false);

    // The author sees their archived content flagged as such, with authorship.
    const authorClient = await createUserClient(AUTHOR_EMAIL);
    const { data: authorRows } = await authorClient.rpc("list_my_notifications", {
      p_commune_id: communeA,
      p_limit: 20,
    });
    await authorClient.auth.signOut();
    const authorRow = (authorRows ?? []).find((r) => r.title === "archived-author");
    expect(authorRow).toMatchObject({ context_status: "archived", is_author: true });
  });

  it("scopes list and unread count to the requested commune", async () => {
    await insertNotification({
      userId: readerUserId, communeId: communeB, kind: "system", title: "only-in-B",
    });
    await insertNotification({
      userId: readerUserId, communeId: communeB, kind: "system", title: "read-in-B", read: true,
    });

    const { data: rowsA } = await readerClient.rpc("list_my_notifications", {
      p_commune_id: communeA,
      p_limit: 50,
    });
    expect((rowsA ?? []).some((r) => r.title === "only-in-B")).toBe(false);

    const { data: unreadB } = await readerClient.rpc("count_unread_notifications", {
      p_commune_id: communeB,
    });
    expect(unreadB).toBe(1);
  });

  it("paginates with a (created_at, id) keyset cursor without gaps or duplicates", async () => {
    const { data: page1 } = await readerClient.rpc("list_my_notifications", {
      p_commune_id: communeA,
      p_limit: 2,
    });
    expect(page1).toHaveLength(2);
    const last = page1![1];

    const { data: page2 } = await readerClient.rpc("list_my_notifications", {
      p_commune_id: communeA,
      p_limit: 50,
      p_before_created_at: last.created_at,
      p_before_id: last.id,
    });
    const ids1 = new Set(page1!.map((r) => r.id));
    expect(page2!.every((r) => !ids1.has(r.id))).toBe(true);

    const { data: all } = await readerClient.rpc("list_my_notifications", {
      p_commune_id: communeA,
      p_limit: 50,
    });
    expect(page1!.length + page2!.length).toBe(all!.length);
  });

  it("deletes notifications when their content row is deleted (trigger)", async () => {
    const announcementId = await createAnnouncement("ouverte");
    const notificationId = await insertNotification({
      userId: readerUserId, communeId: communeA, kind: "new_content",
      contextType: "announcement", contextId: announcementId, title: "to-delete",
    });

    const { error: delErr } = await service.from("announcements").delete().eq("id", announcementId);
    expect(delErr).toBeNull();

    const { data: remaining } = await service
      .from("notifications")
      .select("id")
      .eq("id", notificationId);
    expect(remaining).toHaveLength(0);
  });

  it("marks a notification as read by tag only for the calling user (route contract)", async () => {
    const announcementId = await createAnnouncement("ouverte");
    const tag = `announcement:${announcementId}`;
    await insertNotification({
      userId: readerUserId, communeId: communeA, kind: "new_content",
      contextType: "announcement", contextId: announcementId, title: "tagged-reader",
    });
    await insertNotification({
      userId: authorUserId, communeId: communeA, kind: "engagement",
      contextType: "announcement", contextId: announcementId, title: "tagged-author",
    });

    // Same statement the route handler issues, through the reader's session.
    const { error } = await readerClient
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", readerUserId)
      .eq("tag", tag)
      .is("read_at", null);
    expect(error).toBeNull();

    const { data: rows } = await service
      .from("notifications")
      .select("title, read_at")
      .eq("tag", tag);
    const byTitle = new Map((rows ?? []).map((r) => [r.title, r.read_at]));
    expect(byTitle.get("tagged-reader")).not.toBeNull();
    expect(byTitle.get("tagged-author")).toBeNull();
  });
});
