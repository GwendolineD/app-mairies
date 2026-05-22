import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Membership, Profile } from "@/lib/types";

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

export async function requireAuth(redirectTo = "/connexion") {
  const ctx = await getSessionContext();
  if (!ctx) redirect(redirectTo);
  return ctx;
}

export async function requireActiveMembership() {
  const ctx = await requireAuth();
  if (ctx.isSuspendedForActiveCommune) {
    redirect("/suspendu");
  }
  if (!ctx.activeMembership) {
    redirect("/inscription/commune");
  }
  return ctx;
}

export async function requireRole(
  roles: Array<"municipality_staff" | "platform_admin">,
) {
  const ctx = await requireAuth();
  if (!roles.includes(ctx.profile.role as "municipality_staff" | "platform_admin")) {
    redirect("/");
  }
  return ctx;
}
