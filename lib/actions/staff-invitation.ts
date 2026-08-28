"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAuth, requireCommuneStaff, requirePlatformAdmin } from "@/lib/auth/session";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendTemplatedEmail } from "@/lib/email/render-template";
import { ROUTES } from "@/lib/constants/routes";
import { getAppUrl } from "@/lib/utils/app-url";
import { DAY_MS } from "@/lib/datetime";
import type { MembershipRole } from "@/lib/types";

export type StaffActionResult =
  | { success: true }
  | { success: false; error: string };

const staffInvitationSchema = z.object({
  communeId: z.string().uuid(),
  email: z.string().email("Email invalide"),
  intendedRole: z.enum(["member", "staff", "mayor"]),
});

function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Invite someone with a specific role — called from the mairie space.
 * Requires the caller to be commune staff/mayor or platform admin.
 */
export async function createStaffInvitation(formData: FormData) {
  const ctx = await requireCommuneStaff();

  const parsed = staffInvitationSchema.safeParse({
    communeId: formData.get("communeId"),
    email: formData.get("email"),
    intendedRole: formData.get("intendedRole"),
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  if (parsed.data.communeId !== ctx.communeId) {
    return { error: { form: ["Vous n'avez pas accès à cette commune."] } };
  }

  return doCreateStaffInvitation({
    communeId: parsed.data.communeId,
    email: parsed.data.email,
    intendedRole: parsed.data.intendedRole as MembershipRole,
    inviterUserId: ctx.userId,
    inviterMembershipId: ctx.activeMembership?.id ?? null,
  });
}

/**
 * Invite someone with a specific role — called from the backoffice.
 * Requires platform admin.
 */
export async function createStaffInvitationAsAdmin(formData: FormData) {
  const ctx = await requirePlatformAdmin();

  const parsed = staffInvitationSchema.safeParse({
    communeId: formData.get("communeId"),
    email: formData.get("email"),
    intendedRole: formData.get("intendedRole"),
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const staffMembership = ctx.memberships.find(
    (m) => m.commune_id === parsed.data.communeId && m.status === "active",
  );

  return doCreateStaffInvitation({
    communeId: parsed.data.communeId,
    email: parsed.data.email,
    intendedRole: parsed.data.intendedRole as MembershipRole,
    inviterUserId: ctx.userId,
    inviterMembershipId: staffMembership?.id ?? null,
  });
}

async function resolveInviterName(
  serviceClient: Awaited<ReturnType<typeof createServiceClient>>,
  inviterUserId: string | null,
  inviterMembershipId: string | null,
): Promise<string> {
  if (inviterMembershipId) {
    const { data } = await serviceClient
      .from("memberships")
      .select("user_id, profile:profiles!memberships_profiles_user_id_fkey(first_name, last_name, display_name)")
      .eq("id", inviterMembershipId)
      .maybeSingle();
    const p = Array.isArray(data?.profile) ? data.profile[0] : data?.profile;
    if (p) {
      const parts = [p.first_name, p.last_name].filter(Boolean);
      if (parts.length) return parts.join(" ");
      if (p.display_name?.trim()) return p.display_name.trim();
    }
  }
  if (inviterUserId) {
    const { data } = await serviceClient
      .from("profiles")
      .select("first_name, last_name, display_name")
      .eq("user_id", inviterUserId)
      .maybeSingle();
    if (data) {
      const parts = [data.first_name, data.last_name].filter(Boolean);
      if (parts.length) return parts.join(" ");
      if (data.display_name?.trim()) return data.display_name.trim();
    }
  }
  return "Tous Voisins";
}

async function doCreateStaffInvitation(params: {
  communeId: string;
  email: string;
  intendedRole: MembershipRole;
  inviterUserId: string;
  inviterMembershipId: string | null;
}) {
  const { communeId, email, intendedRole, inviterUserId, inviterMembershipId } = params;
  const serviceClient = await createServiceClient();

  // Guard: duplicate pending invitation
  const { data: existing } = await serviceClient
    .from("neighbor_invites")
    .select("id")
    .eq("commune_id", communeId)
    .eq("email", email)
    .is("accepted_at", null)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .maybeSingle();

  if (existing) {
    return { error: { form: ["Une invitation est déjà en attente pour cette adresse."] } };
  }

  // Guard: already a member (RPC avoids listUsers() 50-account cap)
  const { data: matchingUserId } = await serviceClient.rpc("admin_find_user_by_email", { p_email: email });

  if (matchingUserId) {
    const { data: existingMembership } = await serviceClient
      .from("memberships")
      .select("id, status")
      .eq("user_id", matchingUserId)
      .eq("commune_id", communeId)
      .eq("status", "active")
      .maybeSingle();

    if (existingMembership) {
      return { error: { form: ["Cette personne est déjà membre de la commune. Pour modifier son rôle, rendez-vous dans la liste des habitants."] } };
    }
  }

  // Lookup commune for email
  const { data: commune } = await serviceClient
    .from("communes")
    .select("name, insee_code")
    .eq("id", communeId)
    .single();

  if (!commune) {
    return { error: { form: ["Commune introuvable."] } };
  }

  const token = generateToken();

  const { error: insertError } = await serviceClient.from("neighbor_invites").insert({
    inviter_membership_id: inviterMembershipId,
    inviter_user_id: inviterUserId,
    commune_id: communeId,
    email,
    token,
    intended_role: intendedRole,
    expires_at: new Date(Date.now() + 30 * DAY_MS).toISOString(),
  });

  if (insertError) {
    console.error("[createStaffInvitation] insert failed", insertError.message);
    return { error: { form: ["Impossible de créer l'invitation."] } };
  }

  const senderName = await resolveInviterName(serviceClient, inviterUserId, inviterMembershipId);
  const inviteLink = `${getAppUrl()}${ROUTES.inscription.root}?invite=${token}&commune=${encodeURIComponent(commune.insee_code)}&email=${encodeURIComponent(email)}`;

  const emailResult = await sendTemplatedEmail(email, "neighbor-invite", {
    sender_name: senderName,
    commune_name: commune.name,
    invite_link: inviteLink,
  });

  if (!emailResult.success) {
    console.error("[createStaffInvitation] email send failed", emailResult.error);
    await serviceClient
      .from("neighbor_invites")
      .delete()
      .eq("token", token)
      .eq("commune_id", communeId);

    return { error: { form: ["L'invitation n'a pas pu être envoyée par e-mail. Réessayez plus tard."] } };
  }

  revalidatePath("/mairie");
  revalidatePath("/backoffice");

  return { success: true };
}

// ---------- Batch invitations (1..N emails, unified entry point) ----------

const MAX_BATCH = 20;

const emailListSchema = z
  .string()
  .min(1, "Au moins un email est requis.")
  .transform((v) =>
    v
      .split(/[,;\n]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  )
  .pipe(
    z
      .array(z.string().email("Email invalide"))
      .min(1, "Au moins un email est requis.")
      .max(MAX_BATCH, `Maximum ${MAX_BATCH} emails par envoi.`),
  );

export async function createBatchInvitations(
  communeId: string,
  rawEmails: string,
  intendedRole: MembershipRole,
): Promise<{ success: boolean; sentCount: number; failedEmails: string[] }> {
  const ctx = await requireCommuneStaff();
  if (ctx.communeId !== communeId) {
    return { success: false, sentCount: 0, failedEmails: [] };
  }

  return doBatchInvitations({
    communeId,
    rawEmails,
    intendedRole,
    inviterUserId: ctx.userId,
    inviterMembershipId: ctx.activeMembership?.id ?? null,
  });
}

export async function createBatchInvitationsAsAdmin(
  communeId: string,
  rawEmails: string,
  intendedRole: MembershipRole,
): Promise<{ success: boolean; sentCount: number; failedEmails: string[] }> {
  const ctx = await requirePlatformAdmin();

  const staffMembership = ctx.memberships.find(
    (m) => m.commune_id === communeId && m.status === "active",
  );

  return doBatchInvitations({
    communeId,
    rawEmails,
    intendedRole,
    inviterUserId: ctx.userId,
    inviterMembershipId: staffMembership?.id ?? null,
  });
}

async function doBatchInvitations(params: {
  communeId: string;
  rawEmails: string;
  intendedRole: MembershipRole;
  inviterUserId: string;
  inviterMembershipId: string | null;
}): Promise<{ success: boolean; sentCount: number; failedEmails: string[] }> {
  const parsed = emailListSchema.safeParse(params.rawEmails);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Emails invalides.";
    return { success: false, sentCount: 0, failedEmails: [msg] };
  }

  const emails = parsed.data;
  const failedEmails: string[] = [];
  let sentCount = 0;

  const results = await Promise.allSettled(
    emails.map(async (email) => {
      const res = await doCreateStaffInvitation({
        communeId: params.communeId,
        email,
        intendedRole: params.intendedRole,
        inviterUserId: params.inviterUserId,
        inviterMembershipId: params.inviterMembershipId,
      });

      if ("error" in res) {
        const msg =
          res.error && typeof res.error === "object" && "form" in res.error
            ? ((res.error as { form?: string[] }).form?.[0] ?? "Erreur")
            : "Erreur";
        failedEmails.push(emails.length > 1 ? `${email} : ${msg}` : msg);
        throw new Error(msg);
      }

      sentCount++;
    }),
  );

  revalidatePath("/mairie");
  revalidatePath("/backoffice");

  return {
    success: sentCount > 0,
    sentCount,
    failedEmails,
  };
}

// ---------- Resend / Delete ----------

export async function resendInvitation(inviteId: string): Promise<StaffActionResult> {
  const ctx = await requireCommuneStaff();
  const serviceClient = await createServiceClient();

  const { data: invite } = await serviceClient
    .from("neighbor_invites")
    .select("id, commune_id, email, inviter_user_id, inviter_membership_id, accepted_at, expires_at, token")
    .eq("id", inviteId)
    .maybeSingle();

  if (!invite) return { success: false, error: "Invitation introuvable." };
  if (invite.commune_id !== ctx.communeId) {
    return { success: false, error: "Vous n'avez pas accès à cette invitation." };
  }
  if (invite.accepted_at) return { success: false, error: "Cette invitation a déjà été acceptée." };

  const { data: commune } = await serviceClient
    .from("communes")
    .select("name, insee_code")
    .eq("id", invite.commune_id)
    .single();

  if (!commune) return { success: false, error: "Commune introuvable." };

  const senderName = await resolveInviterName(serviceClient, invite.inviter_user_id, invite.inviter_membership_id);
  const inviteLink = `${getAppUrl()}${ROUTES.inscription.root}?invite=${invite.token}&commune=${encodeURIComponent(commune.insee_code)}&email=${encodeURIComponent(invite.email)}`;

  const emailResult = await sendTemplatedEmail(invite.email, "neighbor-invite", {
    sender_name: senderName,
    commune_name: commune.name,
    invite_link: inviteLink,
  });

  if (!emailResult.success) {
    return { success: false, error: "L'email n'a pas pu être envoyé." };
  }

  await serviceClient
    .from("neighbor_invites")
    .update({
      expires_at: new Date(Date.now() + 30 * DAY_MS).toISOString(),
      reminder_sent_at: null,
    })
    .eq("id", invite.id);

  revalidatePath("/mairie");
  return { success: true };
}

export async function resendInvitationAsAdmin(inviteId: string): Promise<StaffActionResult> {
  await requirePlatformAdmin();
  const serviceClient = await createServiceClient();

  const { data: invite } = await serviceClient
    .from("neighbor_invites")
    .select("id, commune_id, email, inviter_user_id, inviter_membership_id, accepted_at, expires_at, token")
    .eq("id", inviteId)
    .maybeSingle();

  if (!invite) return { success: false, error: "Invitation introuvable." };
  if (invite.accepted_at) return { success: false, error: "Cette invitation a déjà été acceptée." };

  const { data: commune } = await serviceClient
    .from("communes")
    .select("name, insee_code")
    .eq("id", invite.commune_id)
    .single();

  if (!commune) return { success: false, error: "Commune introuvable." };

  const senderName = await resolveInviterName(serviceClient, invite.inviter_user_id, invite.inviter_membership_id);
  const inviteLink = `${getAppUrl()}${ROUTES.inscription.root}?invite=${invite.token}&commune=${encodeURIComponent(commune.insee_code)}&email=${encodeURIComponent(invite.email)}`;

  const emailResult = await sendTemplatedEmail(invite.email, "neighbor-invite", {
    sender_name: senderName,
    commune_name: commune.name,
    invite_link: inviteLink,
  });

  if (!emailResult.success) {
    return { success: false, error: "L'email n'a pas pu être envoyé." };
  }

  await serviceClient
    .from("neighbor_invites")
    .update({
      expires_at: new Date(Date.now() + 30 * DAY_MS).toISOString(),
      reminder_sent_at: null,
    })
    .eq("id", invite.id);

  revalidatePath("/backoffice");
  return { success: true };
}

export async function deleteInvitation(inviteId: string): Promise<StaffActionResult> {
  const ctx = await requireCommuneStaff();
  const serviceClient = await createServiceClient();

  const { data: invite } = await serviceClient
    .from("neighbor_invites")
    .select("id, commune_id, accepted_at")
    .eq("id", inviteId)
    .maybeSingle();

  if (!invite) return { success: false, error: "Invitation introuvable." };
  if (invite.commune_id !== ctx.communeId) {
    return { success: false, error: "Vous n'avez pas accès à cette invitation." };
  }
  if (invite.accepted_at) return { success: false, error: "Impossible de supprimer une invitation acceptée." };

  await serviceClient
    .from("neighbor_invites")
    .delete()
    .eq("id", invite.id);

  revalidatePath("/mairie");
  return { success: true };
}

export async function deleteInvitationAsAdmin(inviteId: string): Promise<StaffActionResult> {
  await requirePlatformAdmin();
  const serviceClient = await createServiceClient();

  const { data: invite } = await serviceClient
    .from("neighbor_invites")
    .select("id, accepted_at")
    .eq("id", inviteId)
    .maybeSingle();

  if (!invite) return { success: false, error: "Invitation introuvable." };
  if (invite.accepted_at) return { success: false, error: "Impossible de supprimer une invitation acceptée." };

  await serviceClient
    .from("neighbor_invites")
    .delete()
    .eq("id", invite.id);

  revalidatePath("/backoffice");
  return { success: true };
}

// ---------- Trial max members (backoffice only) ----------

export async function updateTrialMaxMembers(
  communeId: string,
  maxMembers: number,
): Promise<StaffActionResult> {
  await requirePlatformAdmin();

  if (!Number.isInteger(maxMembers) || maxMembers < 1 || maxMembers > 1000) {
    return { success: false, error: "Le nombre doit être entre 1 et 1000." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("communes")
    .update({ trial_max_members: maxMembers })
    .eq("id", communeId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(ROUTES.backoffice.communeDetail(communeId));
  return { success: true };
}

// ---------- acceptInvitation (Scenario B: logged-in user) ----------

const acceptInvitationSchema = z.object({
  token: z.string().min(1),
  addressStreet: z.string().min(1, "Rue requise"),
  addressCity: z.string().min(1, "Ville requise"),
  addressCitycode: z.string().min(1),
  addressPostcode: z.string().min(4),
  addressLat: z.number(),
  addressLng: z.number(),
});

export async function acceptInvitation(formData: FormData) {
  const ctx = await requireAuth();

  const parsed = acceptInvitationSchema.safeParse({
    token: formData.get("token"),
    addressStreet: formData.get("addressStreet"),
    addressCity: formData.get("addressCity"),
    addressCitycode: formData.get("addressCitycode"),
    addressPostcode: formData.get("addressPostcode"),
    addressLat: Number(formData.get("addressLat")),
    addressLng: Number(formData.get("addressLng")),
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const serviceClient = await createServiceClient();

  const { data: invite } = await serviceClient
    .from("neighbor_invites")
    .select("id, commune_id, intended_role, email, accepted_at, expires_at")
    .eq("token", parsed.data.token)
    .maybeSingle();

  if (!invite) {
    return { error: { form: ["Ce lien d'invitation est invalide."] } };
  }
  if (invite.accepted_at) {
    return { error: { form: ["Cette invitation a déjà été utilisée."] } };
  }
  if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
    return { error: { form: ["Ce lien d'invitation a expiré."] } };
  }

  // Verify email matches session user
  const { data: { user } } = await serviceClient.auth.admin.getUserById(ctx.userId);
  if (!user || user.email?.toLowerCase() !== invite.email.toLowerCase()) {
    return { error: { form: ["Cette invitation a été envoyée à une autre adresse email."] } };
  }

  // Trial member cap
  const { data: commune } = await serviceClient
    .from("communes")
    .select("id, access_status, trial_max_members")
    .eq("id", invite.commune_id)
    .single();

  if (!commune || (commune.access_status !== "active" && commune.access_status !== "trial")) {
    return { error: { form: ["Cette commune n'est pas encore active."] } };
  }

  if (commune.access_status === "trial") {
    const { count: currentMembers } = await serviceClient
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("commune_id", commune.id)
      .eq("status", "active");

    if ((currentMembers ?? 0) >= commune.trial_max_members) {
      return {
        error: { form: ["Le nombre maximum de testeurs pour cette commune a été atteint."] },
      };
    }
  }

  // Check existing membership
  const { data: existingMembership } = await serviceClient
    .from("memberships")
    .select("id, status")
    .eq("user_id", ctx.userId)
    .eq("commune_id", commune.id)
    .maybeSingle();

  const intendedRole = invite.intended_role as MembershipRole;

  if (existingMembership) {
    if (existingMembership.status === "active") {
      return { error: { form: ["Vous êtes déjà membre de cette commune."] } };
    }

    // Reactivate a "left" membership with the intended role
    await serviceClient
      .from("memberships")
      .update({
        status: "active",
        role: intendedRole,
        address_street: parsed.data.addressStreet,
        address_city: parsed.data.addressCity,
        address_citycode: parsed.data.addressCitycode,
        address_postcode: parsed.data.addressPostcode,
        address_lat: parsed.data.addressLat,
        address_lng: parsed.data.addressLng,
      })
      .eq("id", existingMembership.id);
  } else {
    await serviceClient.from("memberships").insert({
      user_id: ctx.userId,
      commune_id: commune.id,
      address_street: parsed.data.addressStreet,
      address_city: parsed.data.addressCity,
      address_citycode: parsed.data.addressCitycode,
      address_postcode: parsed.data.addressPostcode,
      address_lat: parsed.data.addressLat,
      address_lng: parsed.data.addressLng,
      is_primary: false,
      status: "active",
      role: intendedRole,
    });
  }

  // Mark invitation as accepted
  await serviceClient
    .from("neighbor_invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  // Set active commune
  await serviceClient
    .from("profiles")
    .update({ active_commune_id: commune.id })
    .eq("user_id", ctx.userId);

  revalidatePath("/mairie", "layout");
  revalidatePath("/backoffice", "layout");
  redirect(ROUTES.accueil);
}
