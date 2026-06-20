"use server";

import { revalidatePath } from "next/cache";
import { getSessionContext } from "@/lib/auth/session";
import {
  COMMUNE_STAFF_ROLES,
  MEMBERSHIP_ROLES,
} from "@/lib/constants/roles";
import { ROUTES } from "@/lib/constants/routes";
import { MEMBERSHIP_STATUS } from "@/lib/constants/statuses";
import { createClient } from "@/lib/supabase/server";
import type { MembershipRole } from "@/lib/types";
import type { ModerationActionResult } from "@/lib/actions/moderation";

type ChangeMembershipRoleInput = {
  membershipId: string;
  newRole: MembershipRole;
  isPlatformAdmin?: boolean;
};

const VALID_ROLES = new Set<MembershipRole>([
  MEMBERSHIP_ROLES.member,
  MEMBERSHIP_ROLES.staff,
  MEMBERSHIP_ROLES.mayor,
]);

async function assertCanChangeMembershipRole(membershipId: string) {
  const ctx = await getSessionContext();
  if (!ctx) {
    return { error: "Non authentifié." as const };
  }

  const supabase = await createClient();
  const { data: membership, error: fetchError } = await supabase
    .from("memberships")
    .select("id, user_id, commune_id, role, status")
    .eq("id", membershipId)
    .maybeSingle();

  if (fetchError || !membership) {
    return { error: "Adhésion introuvable." as const };
  }

  if (membership.status === MEMBERSHIP_STATUS.left) {
    return { error: "Cette adhésion n'est plus active." as const };
  }

  if (ctx.profile.is_platform_admin) {
    return {
      membership,
      actorUserId: ctx.userId,
      canSetPlatformAdmin: true,
    } as const;
  }

  const staffMembership = ctx.memberships.find(
    (row) =>
      row.commune_id === membership.commune_id &&
      row.status === MEMBERSHIP_STATUS.active &&
      (COMMUNE_STAFF_ROLES as readonly MembershipRole[]).includes(row.role),
  );

  if (!staffMembership) {
    return { error: "Vous n'avez pas les droits pour modifier ce rôle." as const };
  }

  return {
    membership,
    actorUserId: ctx.userId,
    canSetPlatformAdmin: false,
  } as const;
}

async function assertNotLastMayorDemotion(
  supabase: Awaited<ReturnType<typeof createClient>>,
  membership: { id: string; commune_id: string; role: MembershipRole },
  newRole: MembershipRole,
) {
  if (membership.role !== MEMBERSHIP_ROLES.mayor || newRole === MEMBERSHIP_ROLES.mayor) {
    return null;
  }

  const { count, error } = await supabase
    .from("memberships")
    .select("id", { count: "exact", head: true })
    .eq("commune_id", membership.commune_id)
    .eq("role", MEMBERSHIP_ROLES.mayor)
    .eq("status", MEMBERSHIP_STATUS.active);

  if (error) {
    return "Impossible de vérifier les maires de la commune.";
  }

  if ((count ?? 0) <= 1) {
    return "Impossible de retirer le dernier maire de la commune.";
  }

  return null;
}

function revalidateMembershipRolePaths(userId: string, communeId: string) {
  revalidatePath(ROUTES.mairie.habitants);
  revalidatePath(ROUTES.backoffice.userDetail(userId));
  revalidatePath(ROUTES.backoffice.communeDetail(communeId));
}

export async function changeMembershipRole(
  input: ChangeMembershipRoleInput,
): Promise<ModerationActionResult> {
  const { membershipId, newRole, isPlatformAdmin } = input;

  if (!membershipId || !VALID_ROLES.has(newRole)) {
    return { success: false, error: "Paramètres invalides." };
  }

  const authResult = await assertCanChangeMembershipRole(membershipId);
  if ("error" in authResult && authResult.error) {
    return { success: false, error: authResult.error };
  }

  const { membership, canSetPlatformAdmin } = authResult;
  const supabase = await createClient();

  const lastMayorError = await assertNotLastMayorDemotion(
    supabase,
    membership,
    newRole,
  );
  if (lastMayorError) {
    return { success: false, error: lastMayorError };
  }

  if (membership.role !== newRole) {
    const { error: roleError } = await supabase
      .from("memberships")
      .update({ role: newRole })
      .eq("id", membershipId);

    if (roleError) {
      return { success: false, error: roleError.message };
    }
  }

  if (isPlatformAdmin !== undefined) {
    if (!canSetPlatformAdmin) {
      return {
        success: false,
        error: "Seul un Super Admin peut modifier ce statut.",
      };
    }

    const { data: targetProfile, error: profileFetchError } = await supabase
      .from("profiles")
      .select("is_platform_admin")
      .eq("user_id", membership.user_id)
      .maybeSingle();

    if (profileFetchError || !targetProfile) {
      return { success: false, error: "Profil introuvable." };
    }

    if (targetProfile.is_platform_admin !== isPlatformAdmin) {
      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update({ is_platform_admin: isPlatformAdmin })
        .eq("user_id", membership.user_id);

      if (profileUpdateError) {
        return { success: false, error: profileUpdateError.message };
      }
    }
  }

  revalidateMembershipRolePaths(membership.user_id, membership.commune_id);
  return { success: true };
}
