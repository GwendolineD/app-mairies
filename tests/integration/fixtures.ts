/**
 * Fixtures for the integration suite, against the local Supabase stack.
 *
 * Two throwaway communes on a dedicated INSEE namespace (99001 / 99002), each
 * with two active members and one row in every tenant-scoped table. Everything
 * is created and destroyed by the suite itself: no `supabase db reset`, and the
 * dev seed (Les Authieux, 27027) is never touched.
 *
 * `purgeFixtures` runs before creation as well as after, so a crashed run
 * leaves nothing behind that would break the next one.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

export const INSEE_A = "99001";
export const INSEE_B = "99002";

/** Distinctive domain so leftover accounts are identifiable and safe to purge. */
const EMAIL_DOMAIN = "tenant-isolation.integration.test";
const PASSWORD = "IntegrationTest2026!";

export type FixtureMember = {
  userId: string;
  email: string;
  membershipId: string;
};

export type TenantFixture = {
  inseeCode: string;
  communeId: string;
  /** `[0]` authors the content, `[1]` files the report. */
  members: [FixtureMember, FixtureMember];
  announcementId: string;
  initiativeId: string;
  eventId: string;
  reportId: string;
  conversationId: string;
};

export type Fixtures = {
  service: SupabaseClient<Database>;
  tenantA: TenantFixture;
  tenantB: TenantFixture;
};

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

/**
 * Refuses to run against anything but the local stack.
 *
 * This suite creates and deletes communes and accounts with a service-role key.
 * Pointed at a hosted project it would pollute real data, so the host is checked
 * before any client is built.
 */
function requireLocalSupabaseUrl(): string {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const { hostname } = new URL(url);

  if (hostname !== "127.0.0.1" && hostname !== "localhost") {
    throw new Error(
      `Refus d'exécuter la suite d'intégration contre ${hostname}. ` +
        "Cette suite crée et supprime des communes et des comptes : elle ne " +
        "doit viser que le Supabase local (npx supabase start).",
    );
  }

  return url;
}

export function createServiceClient(): SupabaseClient<Database> {
  return createClient<Database>(
    requireLocalSupabaseUrl(),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

/**
 * An anon-key client signed in as `email`, so PostgREST evaluates the RLS
 * policies for that user. This is the only way to assert tenant isolation:
 * the service-role client bypasses RLS entirely.
 */
export async function signInAs(email: string): Promise<SupabaseClient<Database>> {
  const client = createClient<Database>(
    requireLocalSupabaseUrl(),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { error } = await client.auth.signInWithPassword({
    email,
    password: PASSWORD,
  });
  if (error) throw new Error(`signInAs(${email}): ${error.message}`);

  return client;
}

/** Paginated on purpose: `listUsers()` defaults to the first 50 accounts only. */
async function findFixtureUserIds(
  service: SupabaseClient<Database>,
): Promise<string[]> {
  const ids: string[] = [];
  const perPage = 200;

  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await service.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw new Error(`findFixtureUserIds: ${error.message}`);

    for (const user of data.users) {
      if (user.email?.endsWith(`@${EMAIL_DOMAIN}`)) ids.push(user.id);
    }
    if (data.users.length < perPage) break;
  }

  return ids;
}

export async function purgeFixtures(
  service: SupabaseClient<Database>,
): Promise<void> {
  const { data: communes } = await service
    .from("communes")
    .select("id")
    .in("insee_code", [INSEE_A, INSEE_B]);

  const communeIds = (communes ?? []).map((commune) => commune.id);

  if (communeIds.length > 0) {
    // Content first: `author_membership_id` is ON DELETE RESTRICT, so deleting
    // the commune would otherwise fail when it cascades into memberships.
    await service.from("announcements").delete().in("commune_id", communeIds);
    await service.from("initiatives").delete().in("commune_id", communeIds);
    await service.from("events").delete().in("commune_id", communeIds);
    await service.from("conversations").delete().in("commune_id", communeIds);
    await service.from("reports").delete().in("commune_id", communeIds);
    await service.from("communes").delete().in("id", communeIds);
  }

  for (const userId of await findFixtureUserIds(service)) {
    await service.auth.admin.deleteUser(userId);
  }
}

async function createMember(
  service: SupabaseClient<Database>,
  options: { communeId: string; inseeCode: string; index: number },
): Promise<FixtureMember> {
  const email = `member-${options.inseeCode}-${options.index}@${EMAIL_DOMAIN}`;

  const { data: created, error: userError } =
    await service.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: {
        first_name: `Membre${options.index}`,
        last_name: options.inseeCode,
        display_name: `Membre${options.index} ${options.inseeCode}`,
      },
    });
  if (userError || !created.user) {
    throw new Error(`createMember(${email}): ${userError?.message ?? "no user"}`);
  }
  const userId = created.user.id;

  // `handle_new_user` already inserted the profile row; only the active commune
  // needs setting.
  const { error: profileError } = await service
    .from("profiles")
    .update({ active_commune_id: options.communeId })
    .eq("user_id", userId);
  if (profileError) {
    throw new Error(`createMember(profile ${email}): ${profileError.message}`);
  }

  const { data: membership, error: membershipError } = await service
    .from("memberships")
    .insert({
      user_id: userId,
      commune_id: options.communeId,
      address_city: `Commune ${options.inseeCode}`,
      address_citycode: options.inseeCode,
      is_primary: true,
      status: "active",
    })
    .select("id")
    .single();
  if (membershipError || !membership) {
    throw new Error(
      `createMember(membership ${email}): ${membershipError?.message ?? "no row"}`,
    );
  }

  return { userId, email, membershipId: membership.id };
}

async function createTenant(
  service: SupabaseClient<Database>,
  options: { inseeCode: string; name: string },
): Promise<TenantFixture> {
  const { data: commune, error: communeError } = await service
    .from("communes")
    .insert({
      insee_code: options.inseeCode,
      name: options.name,
      postcode: options.inseeCode,
      department: "Test",
      access_status: "active",
    })
    .select("id")
    .single();
  if (communeError || !commune) {
    throw new Error(
      `createTenant(${options.inseeCode}): ${communeError?.message ?? "no row"}`,
    );
  }
  const communeId = commune.id;

  const members: [FixtureMember, FixtureMember] = [
    await createMember(service, {
      communeId,
      inseeCode: options.inseeCode,
      index: 1,
    }),
    await createMember(service, {
      communeId,
      inseeCode: options.inseeCode,
      index: 2,
    }),
  ];

  const [author, reporter] = members;

  const { data: announcement, error: announcementError } = await service
    .from("announcements")
    .insert({
      commune_id: communeId,
      author_membership_id: author.membershipId,
      type: "demande",
      category_slug: "bricolage",
      title: `Annonce ${options.inseeCode}`,
      description: `Contenu privé de la commune ${options.inseeCode}`,
    })
    .select("id")
    .single();
  if (announcementError || !announcement) {
    throw new Error(
      `createTenant(announcement): ${announcementError?.message ?? "no row"}`,
    );
  }

  const { data: initiative, error: initiativeError } = await service
    .from("initiatives")
    .insert({
      commune_id: communeId,
      author_membership_id: author.membershipId,
      title: `Initiative ${options.inseeCode}`,
      category_slug: "solidarite",
    })
    .select("id")
    .single();
  if (initiativeError || !initiative) {
    throw new Error(
      `createTenant(initiative): ${initiativeError?.message ?? "no row"}`,
    );
  }

  const startsAt = new Date("2026-12-01T18:00:00.000Z").toISOString();
  const endsAt = new Date("2026-12-01T20:00:00.000Z").toISOString();
  const { data: event, error: eventError } = await service
    .from("events")
    .insert({
      commune_id: communeId,
      author_membership_id: author.membershipId,
      title: `Événement ${options.inseeCode}`,
      starts_at: startsAt,
      ends_at: endsAt,
    })
    .select("id")
    .single();
  if (eventError || !event) {
    throw new Error(`createTenant(event): ${eventError?.message ?? "no row"}`);
  }

  // trg_reports_set_commune overwrites commune_id from the reporter's
  // membership; it is passed here only because the generated type requires it.
  const { data: report, error: reportError } = await service
    .from("reports")
    .insert({
      commune_id: communeId,
      reporter_membership_id: reporter.membershipId,
      context_type: "announcement",
      context_id: announcement.id,
      reason: `Signalement interne ${options.inseeCode}`,
    })
    .select("id")
    .single();
  if (reportError || !report) {
    throw new Error(`createTenant(report): ${reportError?.message ?? "no row"}`);
  }

  const { data: conversation, error: conversationError } = await service
    .from("conversations")
    .insert({
      commune_id: communeId,
      created_by_user_id: author.userId,
      context_type: "announcement",
      context_id: announcement.id,
      participant_a: author.userId,
      participant_b: reporter.userId,
      title: `Conversation ${options.inseeCode}`,
    })
    .select("id")
    .single();
  if (conversationError || !conversation) {
    throw new Error(
      `createTenant(conversation): ${conversationError?.message ?? "no row"}`,
    );
  }

  const { error: participantsError } = await service
    .from("conversation_participants")
    .insert([
      { conversation_id: conversation.id, user_id: author.userId },
      { conversation_id: conversation.id, user_id: reporter.userId },
    ]);
  if (participantsError) {
    throw new Error(`createTenant(participants): ${participantsError.message}`);
  }

  return {
    inseeCode: options.inseeCode,
    communeId,
    members,
    announcementId: announcement.id,
    initiativeId: initiative.id,
    eventId: event.id,
    reportId: report.id,
    conversationId: conversation.id,
  };
}

export async function setupFixtures(): Promise<Fixtures> {
  const service = createServiceClient();

  await purgeFixtures(service);

  const tenantA = await createTenant(service, {
    inseeCode: INSEE_A,
    name: "Commune Test A",
  });
  const tenantB = await createTenant(service, {
    inseeCode: INSEE_B,
    name: "Commune Test B",
  });

  return { service, tenantA, tenantB };
}
