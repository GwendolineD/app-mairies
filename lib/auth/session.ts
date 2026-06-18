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

export async function getSessionContext(): Promise<SessionContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile) return null;

  // If globally banned, prevent access
  if (profile.banned_at) return null;

  const { data: memberships } = await supabase
    .from("memberships")
    .select("*, commune:communes(*)")
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
