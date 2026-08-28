#!/usr/bin/env tsx
/**
 * Local dev helper: seed 55+ auth users to test invite "already member" lookup
 * beyond the old auth.admin.listUsers() 50-account cap.
 *
 * IMPORTANT — this script does NOT send invitations and does NOT write to
 * neighbor_invites. It only creates:
 *   - auth.users (target + fillers)
 *   - profiles + memberships (target only, active member of Les Authieux)
 *
 * Strategy:
 * 1. Create the target member FIRST (older account).
 * 2. Create filler accounts AFTER so listUsers(page 1) returns fillers only.
 * 3. Manual test: invite member-target@… from mairie → expect "already member" error.
 *
 * Usage:
 *   npm run seed-invite-listusers-test          # setup
 *   npm run seed-invite-listusers-test -- --cleanup
 *   npm run seed-invite-listusers-test -- --verify
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (.env.local).
 * Check Supabase Studio: http://localhost:54323 (local stack).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../lib/types/database.types";

const COMMUNE_INSEE = "27027";
const EMAIL_DOMAIN = "invite-listusers-test.local";
const TARGET_EMAIL = `member-target@${EMAIL_DOMAIN}`;
const PASSWORD = "VieLocaleDev2026!";
const FILLER_COUNT = 55;

type ServiceClient = SupabaseClient<Database>;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name}. Run \`npx supabase start\` and fill .env.local from \`npx supabase status -o env\`.`,
    );
  }
  return value;
}

function createServiceClient(): ServiceClient {
  return createClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

function isTestEmail(email: string | undefined): boolean {
  return !!email?.endsWith(`@${EMAIL_DOMAIN}`);
}

async function listAllUsers(service: ServiceClient) {
  const users: { id: string; email?: string }[] = [];
  const perPage = 200;

  for (let page = 1; page <= 50; page += 1) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`listUsers page ${page}: ${error.message}`);
    users.push(...(data.users ?? []));
    if ((data.users ?? []).length < perPage) break;
  }

  return users;
}

async function deleteTestUsers(service: ServiceClient): Promise<number> {
  const users = await listAllUsers(service);
  const toDelete = users.filter((u) => isTestEmail(u.email));

  for (const user of toDelete) {
    const { error } = await service.auth.admin.deleteUser(user.id);
    if (error) {
      console.warn(`Could not delete ${user.email}: ${error.message}`);
    }
  }

  return toDelete.length;
}

async function getCommuneId(service: ServiceClient): Promise<string> {
  const { data, error } = await service
    .from("communes")
    .select("id, name")
    .eq("insee_code", COMMUNE_INSEE)
    .single();

  if (error || !data) {
    throw new Error(
      `Commune INSEE ${COMMUNE_INSEE} not found. Run \`npx supabase db reset\` or seed locally first.`,
    );
  }

  return data.id;
}

async function createAuthUser(
  service: ServiceClient,
  email: string,
  label: string,
): Promise<string> {
  const { data, error } = await service.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: {
      first_name: label,
      last_name: "InviteTest",
      display_name: `${label} InviteTest`,
    },
  });

  if (error || !data.user) {
    throw new Error(`createUser(${email}): ${error?.message ?? "no user"}`);
  }

  return data.user.id;
}

async function ensureTargetMember(service: ServiceClient, communeId: string): Promise<void> {
  const existing = await listAllUsers(service);
  const found = existing.find((u) => u.email?.toLowerCase() === TARGET_EMAIL.toLowerCase());

  let userId = found?.id;
  if (!userId) {
    userId = await createAuthUser(service, TARGET_EMAIL, "MemberTarget");
    console.log(`Created target user ${TARGET_EMAIL}`);
  } else {
    console.log(`Target user already exists: ${TARGET_EMAIL}`);
  }

  const { error: profileError } = await service.from("profiles").upsert(
    {
      user_id: userId,
      first_name: "Member",
      last_name: "Target",
      display_name: "Member Target",
      active_commune_id: communeId,
      has_seen_onboarding: true,
    },
    { onConflict: "user_id" },
  );
  if (profileError) {
    throw new Error(`profile upsert: ${profileError.message}`);
  }

  const { error: membershipError } = await service.from("memberships").upsert(
    {
      user_id: userId,
      commune_id: communeId,
      address_street: "1 rue de test",
      address_city: "Les Authieux",
      address_citycode: COMMUNE_INSEE,
      address_postcode: "27220",
      is_primary: true,
      role: "member",
      status: "active",
    },
    { onConflict: "user_id,commune_id" },
  );
  if (membershipError) {
    throw new Error(`membership upsert: ${membershipError.message}`);
  }
}

async function createFillers(service: ServiceClient): Promise<number> {
  const existing = await listAllUsers(service);
  const existingFillers = new Set(
    existing
      .map((u) => u.email)
      .filter((email): email is string => !!email && email.endsWith(`@${EMAIL_DOMAIN}`)),
  );

  let created = 0;
  for (let i = 0; i < FILLER_COUNT; i += 1) {
    const email = `filler-${String(i).padStart(3, "0")}@${EMAIL_DOMAIN}`;
    if (existingFillers.has(email)) continue;

    await createAuthUser(service, email, `Filler${i}`);
    created += 1;
    if (created % 10 === 0) {
      console.log(`  … ${created} filler account(s) created`);
    }
  }

  return created;
}

function maskUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname}${parsed.port ? `:${parsed.port}` : ""}`;
  } catch {
    return "(invalid URL)";
  }
}

async function verifySetup(service: ServiceClient, communeId: string): Promise<void> {
  const { data: rpcUserId, error: rpcError } = await service.rpc(
    "admin_find_user_by_email",
    { p_email: TARGET_EMAIL },
  );
  if (rpcError) {
    throw new Error(
      `RPC admin_find_user_by_email missing or failed: ${rpcError.message}. Run \`npx supabase db push --local\`.`,
    );
  }
  if (!rpcUserId) {
    throw new Error(`Target user not found in auth.users: ${TARGET_EMAIL}`);
  }

  const { data: membership, error: membershipError } = await service
    .from("memberships")
    .select("id, status, role")
    .eq("user_id", rpcUserId)
    .eq("commune_id", communeId)
    .eq("status", "active")
    .maybeSingle();

  if (membershipError) {
    throw new Error(`membership check failed: ${membershipError.message}`);
  }
  if (!membership) {
    throw new Error(
      `No active membership for ${TARGET_EMAIL} in commune ${communeId}. Setup incomplete.`,
    );
  }

  const users = await listAllUsers(service);
  const testUsers = users.filter((u) => isTestEmail(u.email));
  if (testUsers.length < FILLER_COUNT + 1) {
    throw new Error(
      `Expected at least ${FILLER_COUNT + 1} test users, found ${testUsers.length}.`,
    );
  }

  const firstPage50 = users.slice(0, 50).map((u) => u.email?.toLowerCase());
  const targetInFirst50 = firstPage50.includes(TARGET_EMAIL.toLowerCase());

  console.log("");
  console.log("=== Vérification en base ===");
  console.log(`Supabase: ${maskUrl(requireEnv("NEXT_PUBLIC_SUPABASE_URL"))}`);
  console.log(`Comptes test (*@${EMAIL_DOMAIN}): ${testUsers.length}`);
  console.log(`Cible RPC: ${rpcUserId}`);
  console.log(`Adhésion active: oui (${membership.role})`);
  console.log(`Cible dans les 50 premiers listUsers(): ${targetInFirst50 ? "OUI (problème)" : "non (ok)"}`);
  console.log("");
  console.log("Tables à consulter dans Studio:");
  console.log("  - Authentication > Users  → filler-* et member-target");
  console.log("  - public.memberships    → member-target (status active)");
  console.log("  - public.neighbor_invites → VIDE pour member-target (normal si bloqué)");
  console.log("");
  console.log("Test manuel:");
  console.log(`  Mairie/backoffice → inviter ${TARGET_EMAIL}`);
  console.log('  Attendu: "Cette personne est déjà membre…" (pas d\'email, pas de ligne neighbor_invites)');
}

async function runSetup(service: ServiceClient): Promise<void> {
  console.log(`Supabase cible: ${maskUrl(requireEnv("NEXT_PUBLIC_SUPABASE_URL"))}`);
  console.log("(Ce script n'envoie PAS d'invitations.)\n");

  const communeId = await getCommuneId(service);

  const usersBefore = await listAllUsers(service);
  console.log(`Utilisateurs auth avant setup: ${usersBefore.length}`);
  console.log(`Commune Les Authieux (${COMMUNE_INSEE}): ${communeId}`);
  console.log("Création du membre cible en premier (compte plus ancien)…");
  await ensureTargetMember(service, communeId);

  console.log(`Création de ${FILLER_COUNT} comptes filler…`);
  const created = await createFillers(service);
  console.log(`Comptes filler créés ce run: ${created}`);

  await verifySetup(service, communeId);
  console.log(`Nettoyage: npm run seed-invite-listusers-test -- --cleanup`);
}

async function runVerifyOnly(service: ServiceClient): Promise<void> {
  const communeId = await getCommuneId(service);
  await verifySetup(service, communeId);
}

async function main() {
  const cleanupOnly = process.argv.includes("--cleanup");
  const verifyOnly = process.argv.includes("--verify");
  const service = createServiceClient();

  if (cleanupOnly) {
    const removed = await deleteTestUsers(service);
    console.log(`Supprimé ${removed} compte(s) test (*@${EMAIL_DOMAIN}).`);
    return;
  }

  if (verifyOnly) {
    await runVerifyOnly(service);
    return;
  }

  await runSetup(service);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
