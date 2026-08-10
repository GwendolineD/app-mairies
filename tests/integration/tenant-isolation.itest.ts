/**
 * Tenant isolation, evaluated by the real RLS policies.
 *
 * This is the guard that makes the RLS rewrite safe (docs/scaling-roadmap.md,
 * sujet 9): every case pairs a negative assertion (nothing from commune B) with
 * a positive control (commune A is still visible), so a broken session or an
 * over-restrictive policy cannot make the suite pass vacuously.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database.types";
import {
  purgeFixtures,
  setupFixtures,
  signInAs,
  type Fixtures,
} from "./fixtures";

describe("tenant isolation under RLS", () => {
  let fixtures: Fixtures;
  let clientA: SupabaseClient<Database>;

  beforeAll(async () => {
    fixtures = await setupFixtures();
    clientA = await signInAs(fixtures.tenantA.members[0].email);
  });

  afterAll(async () => {
    if (fixtures?.service) await purgeFixtures(fixtures.service);
  });

  it("signs in as a member of commune A", async () => {
    const { data } = await clientA.auth.getUser();
    expect(data.user?.id).toBe(fixtures.tenantA.members[0].userId);
  });

  it("reads announcements of commune A only", async () => {
    const { data, error } = await clientA.from("announcements").select("id");
    expect(error).toBeNull();

    const ids = (data ?? []).map((row) => row.id);
    expect(ids).toContain(fixtures.tenantA.announcementId);
    expect(ids).not.toContain(fixtures.tenantB.announcementId);
  });

  it("reads initiatives of commune A only", async () => {
    const { data, error } = await clientA.from("initiatives").select("id");
    expect(error).toBeNull();

    const ids = (data ?? []).map((row) => row.id);
    expect(ids).toContain(fixtures.tenantA.initiativeId);
    expect(ids).not.toContain(fixtures.tenantB.initiativeId);
  });

  it("reads events of commune A only", async () => {
    const { data, error } = await clientA.from("events").select("id");
    expect(error).toBeNull();

    const ids = (data ?? []).map((row) => row.id);
    expect(ids).toContain(fixtures.tenantA.eventId);
    expect(ids).not.toContain(fixtures.tenantB.eventId);
  });

  it("reads memberships of commune A only", async () => {
    const { data, error } = await clientA.from("memberships").select("id");
    expect(error).toBeNull();

    const ids = (data ?? []).map((row) => row.id);
    expect(ids).toContain(fixtures.tenantA.members[0].membershipId);
    expect(ids).toContain(fixtures.tenantA.members[1].membershipId);
    expect(ids).not.toContain(fixtures.tenantB.members[0].membershipId);
    expect(ids).not.toContain(fixtures.tenantB.members[1].membershipId);
  });

  it("reads profiles of commune A only", async () => {
    const { data, error } = await clientA.from("profiles").select("user_id");
    expect(error).toBeNull();

    const userIds = (data ?? []).map((row) => row.user_id);
    expect(userIds).toContain(fixtures.tenantA.members[1].userId);
    expect(userIds).not.toContain(fixtures.tenantB.members[0].userId);
    expect(userIds).not.toContain(fixtures.tenantB.members[1].userId);
  });

  it("reads conversations of commune A only", async () => {
    const { data, error } = await clientA.from("conversations").select("id");
    expect(error).toBeNull();

    const ids = (data ?? []).map((row) => row.id);
    expect(ids).toContain(fixtures.tenantA.conversationId);
    expect(ids).not.toContain(fixtures.tenantB.conversationId);
  });

  it("reads reports of commune A only", async () => {
    const { data, error } = await clientA.from("reports").select("id");
    expect(error).toBeNull();

    const ids = (data ?? []).map((row) => row.id);
    expect(ids).not.toContain(fixtures.tenantB.reportId);
  });

  it("cannot fetch a commune B announcement by its id", async () => {
    const { data, error } = await clientA
      .from("announcements")
      .select("id, title")
      .eq("id", fixtures.tenantB.announcementId);

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("cannot update a commune B announcement", async () => {
    const { data } = await clientA
      .from("announcements")
      .update({ title: "Détourné" })
      .eq("id", fixtures.tenantB.announcementId)
      .select("id");

    // RLS filters the row out, so the statement matches nothing rather than
    // raising. The service client confirms the row is untouched.
    expect(data ?? []).toEqual([]);

    const { data: untouched } = await fixtures.service
      .from("announcements")
      .select("title")
      .eq("id", fixtures.tenantB.announcementId)
      .single();
    expect(untouched?.title).toBe(`Annonce ${fixtures.tenantB.inseeCode}`);
  });

  it("cannot delete a commune B announcement", async () => {
    const { data } = await clientA
      .from("announcements")
      .delete()
      .eq("id", fixtures.tenantB.announcementId)
      .select("id");

    expect(data ?? []).toEqual([]);

    const { count } = await fixtures.service
      .from("announcements")
      .select("id", { count: "exact", head: true })
      .eq("id", fixtures.tenantB.announcementId);
    expect(count).toBe(1);
  });

  it("cannot insert content into commune B", async () => {
    const { error } = await clientA.from("announcements").insert({
      commune_id: fixtures.tenantB.communeId,
      author_membership_id: fixtures.tenantA.members[0].membershipId,
      type: "offre",
      category_slug: "bricolage",
      title: "Intrusion",
    });

    expect(error).not.toBeNull();
  });

  it("cannot update a commune B profile", async () => {
    const { data } = await clientA
      .from("profiles")
      .update({ display_name: "Détourné" })
      .eq("user_id", fixtures.tenantB.members[0].userId)
      .select("user_id");

    expect(data ?? []).toEqual([]);

    const { data: untouched } = await fixtures.service
      .from("profiles")
      .select("display_name")
      .eq("user_id", fixtures.tenantB.members[0].userId)
      .single();
    expect(untouched?.display_name).toBe(`Membre1 ${fixtures.tenantB.inseeCode}`);
  });

  it("cannot update a commune B membership", async () => {
    const { data } = await clientA
      .from("memberships")
      .update({ address_city: "Détourné" })
      .eq("id", fixtures.tenantB.members[0].membershipId)
      .select("id");

    expect(data ?? []).toEqual([]);

    const { data: untouched } = await fixtures.service
      .from("memberships")
      .select("address_city")
      .eq("id", fixtures.tenantB.members[0].membershipId)
      .single();
    expect(untouched?.address_city).toBe(`Commune ${fixtures.tenantB.inseeCode}`);
  });

  it("cannot delete a commune B membership", async () => {
    const { data } = await clientA
      .from("memberships")
      .delete()
      .eq("id", fixtures.tenantB.members[0].membershipId)
      .select("id");

    expect(data ?? []).toEqual([]);

    const { count } = await fixtures.service
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("id", fixtures.tenantB.members[0].membershipId);
    expect(count).toBe(1);
  });

  it("cannot insert a membership for another user", async () => {
    const { error } = await clientA.from("memberships").insert({
      user_id: fixtures.tenantB.members[0].userId,
      commune_id: fixtures.tenantA.communeId,
      address_city: "Intrusion",
      address_citycode: fixtures.tenantA.inseeCode,
      is_primary: false,
      status: "active",
    });

    expect(error).not.toBeNull();
  });

  it("reads messages of commune A conversations only", async () => {
    const { data, error } = await clientA.from("messages").select("id");
    expect(error).toBeNull();

    const ids = (data ?? []).map((row) => row.id);
    expect(ids).toContain(fixtures.tenantA.messageId);
    expect(ids).not.toContain(fixtures.tenantB.messageId);
  });

  it("cannot insert a message into a commune B conversation", async () => {
    const { error } = await clientA.from("messages").insert({
      conversation_id: fixtures.tenantB.conversationId,
      sender_id: fixtures.tenantA.members[0].userId,
      body: "Intrusion",
    });

    expect(error).not.toBeNull();
  });

  it("shows a report to its reporter only", async () => {
    const reporterClient = await signInAs(fixtures.tenantA.members[1].email);

    const { data, error } = await reporterClient.from("reports").select("id");
    expect(error).toBeNull();

    const ids = (data ?? []).map((row) => row.id);
    expect(ids).toContain(fixtures.tenantA.reportId);
    expect(ids).not.toContain(fixtures.tenantB.reportId);
  });

  it("hides a report from non-reporters in the same commune", async () => {
    const { data, error } = await clientA.from("reports").select("id");
    expect(error).toBeNull();

    const ids = (data ?? []).map((row) => row.id);
    expect(ids).not.toContain(fixtures.tenantA.reportId);
    expect(ids).not.toContain(fixtures.tenantB.reportId);
  });

  it("cannot insert a neighbor invite with a commune B membership", async () => {
    const { error } = await clientA.from("neighbor_invites").insert({
      inviter_membership_id: fixtures.tenantB.members[0].membershipId,
      commune_id: fixtures.tenantB.communeId,
      email: "intrusion@example.com",
      token: `intrusion-${fixtures.tenantB.inseeCode}`,
    });

    expect(error).not.toBeNull();
  });
});
