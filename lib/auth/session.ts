import { cache } from "react";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { COMMUNE_STAFF_ROLES } from "@/lib/constants/roles";
import { createClient } from "@/lib/supabase/server";
import type { Membership, MembershipRole, Profile } from "@/lib/types";

export type SessionContext = {
  userId: string;
  profile: Profile;
  memberships: Membership[];
  activeCommuneId: string | null;
  activeMembership: Membership | null;
  isSuspendedForActiveCommune: boolean;
};

const PROFILE_COLUMNS =
  "user_id, first_name, last_name, display_name, avatar_url, active_commune_id, is_platform_admin, banned_at, has_seen_onboarding, has_dismissed_notification_prompt";

const MEMBERSHIP_COLUMNS = `*, commune:communes(id, name, insee_code, access_status, settings)`;

async function loadSessionContext(): Promise<SessionContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("user_id", user.id)
    .single();

  if (!profile) return null;

  if (profile.banned_at) return null;

  const { data: memberships } = await supabase
    .from("memberships")
    .select(MEMBERSHIP_COLUMNS)
    .eq("user_id", user.id)
    .neq("status", "left");

  const list = (memberships ?? []) as Membership[];
  const activeCommuneId = profile.active_commune_id;
  const activeMembership =
    list.find(
      (m) => m.commune_id === activeCommuneId && m.status === "active",
    ) ?? list.find((m) => m.status === "active") ?? null;

  const isSuspendedForActiveCommune =
    !!activeCommuneId &&
    list.some(
      (m) => m.commune_id === activeCommuneId && m.status === "suspended",
    ) &&
    !activeMembership;

  return {
    userId: user.id,
    profile: profile as Profile,
    memberships: list,
    activeCommuneId: activeMembership?.commune_id ?? activeCommuneId,
    activeMembership,
    isSuspendedForActiveCommune,
  };
}

/** Deduped within a single RSC render pass; fresh on each navigation / server action. */
export const getSessionContext = cache(loadSessionContext);

export async function requireAuth(redirectTo = ROUTES.connexion) {
  const ctx = await getSessionContext();
  if (!ctx) redirect(redirectTo);
  return ctx;
}

export async function requireActiveMembership() {
  const ctx = await requireAuth();
  if (ctx.isSuspendedForActiveCommune) {
    redirect(ROUTES.suspendu);
  }
  if (!ctx.activeMembership) {
    redirect(ROUTES.inscription.commune);
  }
  return ctx;
}

/**
 * Guard: only platform super-admins.
 */
export async function requirePlatformAdmin() {
  const ctx = await requireAuth();
  if (!ctx.profile.is_platform_admin) {
    redirect(ROUTES.home);
  }
  return ctx;
}

/**
 * Guard: commune staff (staff | mayor on active membership) OR platform admin.
 * Returns the ctx with a guaranteed communeId.
 */
export async function requireCommuneStaff(): Promise<
  SessionContext & { communeId: string }
> {
  const ctx = await requireAuth();

  if (ctx.profile.is_platform_admin && ctx.activeCommuneId) {
    return { ...ctx, communeId: ctx.activeCommuneId };
  }

  const m = ctx.activeMembership;
  if (
    m &&
    (COMMUNE_STAFF_ROLES as readonly MembershipRole[]).includes(m.role)
  ) {
    return { ...ctx, communeId: m.commune_id };
  }

  redirect(ROUTES.home);
}

export { COMMUNE_STAFF_ROLES };
