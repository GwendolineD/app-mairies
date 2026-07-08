"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit/log";
import {
  requireActiveMembership,
  requirePlatformAdmin,
} from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { deleteCloudinaryUserAssets } from "@/lib/services/cloudinary-admin";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export type AccountDeletionResult =
  | { success: true }
  | { success: false; error: string };

async function performAccountDeletion(
  userId: string,
  actorUserId: string,
  auditAction: "auth.delete_own_account" | "admin.delete_user_account",
): Promise<AccountDeletionResult> {
  const serviceClient = await createServiceClient();

  const { data: memberships, error: membershipsError } = await serviceClient
    .from("memberships")
    .select("id, commune_id, created_at")
    .eq("user_id", userId)
    .neq("status", "left");

  if (membershipsError) {
    console.error("[account-deletion] Failed to load memberships", membershipsError.message);
    return {
      success: false,
      error:
        "Une erreur est survenue lors de la suppression du compte. Veuillez réessayer.",
    };
  }

  const membershipRows = memberships ?? [];
  const membershipIds = membershipRows.map((row) => row.id);

  if (membershipRows.length > 0) {
    const archiveRows = membershipRows.map((row) => ({
      commune_id: row.commune_id,
      original_created_at: row.created_at,
    }));

    const { error: archiveError } = await serviceClient
      .from("deleted_membership_archive")
      .insert(archiveRows);

    if (archiveError) {
      console.error("[account-deletion] Failed to archive memberships", archiveError.message);
      return {
        success: false,
        error:
          "Une erreur est survenue lors de la suppression du compte. Veuillez réessayer.",
      };
    }
  }

  if (membershipIds.length > 0) {
    const [
      { data: announcementsToArchive, error: announcementsArchiveReadError },
      { data: initiativesToArchive, error: initiativesArchiveReadError },
      { data: eventsToArchive, error: eventsArchiveReadError },
    ] = await Promise.all([
      serviceClient
        .from("announcements")
        .select("commune_id, created_at, type")
        .in("author_membership_id", membershipIds),
      serviceClient
        .from("initiatives")
        .select("commune_id, created_at")
        .in("author_membership_id", membershipIds),
      serviceClient
        .from("events")
        .select("commune_id, created_at")
        .in("author_membership_id", membershipIds),
    ]);

    if (
      announcementsArchiveReadError ||
      initiativesArchiveReadError ||
      eventsArchiveReadError
    ) {
      console.error("[account-deletion] Failed to load content for archive", {
        announcementsArchiveReadError: announcementsArchiveReadError?.message,
        initiativesArchiveReadError: initiativesArchiveReadError?.message,
        eventsArchiveReadError: eventsArchiveReadError?.message,
      });
      return {
        success: false,
        error:
          "Une erreur est survenue lors de la suppression du compte. Veuillez réessayer.",
      };
    }

    const contentArchiveRows = [
      ...(announcementsToArchive ?? []).map((row) => ({
        commune_id: row.commune_id,
        content_kind: "announcement" as const,
        announcement_type: row.type,
        original_created_at: row.created_at,
      })),
      ...(initiativesToArchive ?? []).map((row) => ({
        commune_id: row.commune_id,
        content_kind: "initiative" as const,
        announcement_type: null,
        original_created_at: row.created_at,
      })),
      ...(eventsToArchive ?? []).map((row) => ({
        commune_id: row.commune_id,
        content_kind: "event" as const,
        announcement_type: null,
        original_created_at: row.created_at,
      })),
    ];

    if (contentArchiveRows.length > 0) {
      const { error: contentArchiveError } = await serviceClient
        .from("deleted_content_creation_archive")
        .insert(contentArchiveRows);

      if (contentArchiveError) {
        console.error(
          "[account-deletion] Failed to archive content creations",
          contentArchiveError.message,
        );
        return {
          success: false,
          error:
            "Une erreur est survenue lors de la suppression du compte. Veuillez réessayer.",
        };
      }
    }

    const deleteByMembership = async (
      table: "announcements" | "initiatives" | "events",
    ) => {
      const { error } = await serviceClient
        .from(table)
        .delete()
        .in("author_membership_id", membershipIds);

      if (error) {
        throw new Error(error.message);
      }
    };

    try {
      await deleteByMembership("announcements");
      await deleteByMembership("initiatives");
      await deleteByMembership("events");
    } catch (error) {
      console.error("[account-deletion] Failed to delete authored content", error);
      return {
        success: false,
        error:
          "Une erreur est survenue lors de la suppression du compte. Veuillez réessayer.",
      };
    }
  }

  const { error: membershipsDeleteError } = await serviceClient
    .from("memberships")
    .delete()
    .eq("user_id", userId);

  if (membershipsDeleteError) {
    console.error(
      "[account-deletion] Failed to delete memberships",
      membershipsDeleteError.message,
    );
    return {
      success: false,
      error:
        "Une erreur est survenue lors de la suppression du compte. Veuillez réessayer.",
    };
  }

  await logAudit({
    action: auditAction,
    category: auditAction.startsWith("admin.") ? "admin" : "auth",
    severity: "critical",
    userId: actorUserId,
    targetType: "user",
    targetId: userId,
    metadata: {
      deleted_membership_count: membershipRows.length,
    },
  });

  const { error: authDeleteError } = await serviceClient.auth.admin.deleteUser(userId);

  if (authDeleteError) {
    console.error("[account-deletion] auth.admin.deleteUser failed", authDeleteError.message);
    return {
      success: false,
      error:
        "Une erreur est survenue lors de la suppression du compte. Veuillez réessayer.",
    };
  }

  void deleteCloudinaryUserAssets(userId).catch((error) => {
    console.error("[account-deletion] Cloudinary cleanup failed", error);
  });

  revalidatePath(ROUTES.accueil);
  revalidatePath(ROUTES.annonces.list);
  revalidatePath(ROUTES.annonces.map);
  revalidatePath(ROUTES.initiatives.list);
  revalidatePath(ROUTES.evenements.list);
  revalidatePath(ROUTES.messages.list);
  revalidatePath(ROUTES.mairie.dashboard);
  revalidatePath(ROUTES.mairie.habitants);
  revalidatePath(ROUTES.backoffice.communes);
  revalidatePath(ROUTES.backoffice.userDetail(userId));

  return { success: true };
}

export async function deleteMyAccount(
  password?: string,
): Promise<AccountDeletionResult> {
  const ctx = await requireActiveMembership();

  if (ctx.profile.is_platform_admin) {
    return {
      success: false,
      error:
        "Les super admins ne peuvent pas supprimer leur propre compte. Retirez d'abord votre statut d'administrateur ou contactez un autre admin.",
    };
  }

  const supabase = await createClient();

  if (password) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return {
        success: false,
        error: "Ce compte n'existe plus ou a déjà été supprimé.",
      };
    }

    const { error: passwordError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });

    if (passwordError) {
      return {
        success: false,
        error: "Le mot de passe saisi est incorrect.",
      };
    }
  }

  const result = await performAccountDeletion(
    ctx.userId,
    ctx.userId,
    "auth.delete_own_account",
  );

  if (!result.success) {
    return result;
  }

  redirect(`${ROUTES.connexion}?account_deleted=1`);
}

export async function deleteUserAccountByAdmin(
  userId: string,
): Promise<AccountDeletionResult> {
  const ctx = await requirePlatformAdmin();

  if (!userId) {
    return { success: false, error: "Paramètres invalides." };
  }

  if (userId === ctx.userId) {
    return {
      success: false,
      error: "Vous ne pouvez pas supprimer votre propre compte depuis le backoffice.",
    };
  }

  const serviceClient = await createServiceClient();
  const { data: targetProfile } = await serviceClient
    .from("profiles")
    .select("user_id, is_platform_admin")
    .eq("user_id", userId)
    .maybeSingle();

  if (!targetProfile) {
    return {
      success: false,
      error: "Ce compte n'existe plus ou a déjà été supprimé.",
    };
  }

  if (targetProfile.is_platform_admin) {
    return {
      success: false,
      error:
        "Impossible de supprimer un super administrateur depuis le backoffice.",
    };
  }

  return performAccountDeletion(userId, ctx.userId, "admin.delete_user_account");
}
