"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { logAudit } from "@/lib/audit/log";
import { RECOVERY_COOKIE_NAME } from "@/lib/constants/auth";
import { ROUTES } from "@/lib/constants/routes";
import { sendEmailChangeVerification } from "@/lib/email/send-email-change-verification";
import { resendVerificationEmailIfNeeded, sendVerificationEmail } from "@/lib/email/send-verification-email";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/utils/app-url";
import { formatAuthError } from "@/lib/utils/auth-errors";
import { formatDisplayName } from "@/lib/utils/display-name";
import { checkRateLimit, resetRateLimit } from "@/lib/utils/rate-limit";
import {
  changePasswordSchema,
  emailChangeSchema,
  forgotPasswordSchema,
  joinCommuneSchema,
  resetPasswordSchema,
  signInSchema,
  signupSchema,
} from "@/lib/validations/schemas";

function isRateLimitError(error: { code?: string; message?: string }): boolean {
  return (
    error.code === "over_email_send_rate_limit" ||
    error.code === "over_request_rate_limit" ||
    /rate limit|too many requests/i.test(error.message ?? "")
  );
}

export async function signUp(formData: FormData) {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    inseeCode: formData.get("inseeCode") as string,
    inviteToken: (formData.get("inviteToken") as string) || undefined,
    addressStreet: formData.get("addressStreet") as string,
    addressLieuDit: (formData.get("addressLieuDit") as string) || undefined,
    addressCity: formData.get("addressCity") as string,
    addressCitycode: formData.get("addressCitycode") as string,
    addressPostcode: formData.get("addressPostcode") as string,
    addressLat: Number(formData.get("addressLat")),
    addressLng: Number(formData.get("addressLng")),
    acceptedTerms: formData.get("acceptedTerms") as string,
  };

  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const serviceClient = await createServiceClient();

  // --- Invite token path: validate and resolve commune + role from the invitation ---
  let inviteRow: {
    id: string;
    commune_id: string;
    intended_role: string;
    email: string;
  } | null = null;

  if (parsed.data.inviteToken) {
    const { data: invite } = await serviceClient
      .from("neighbor_invites")
      .select("id, commune_id, intended_role, email, accepted_at, expires_at")
      .eq("token", parsed.data.inviteToken)
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
    if (invite.email.toLowerCase() !== parsed.data.email.toLowerCase()) {
      return { error: { form: ["Cette invitation a été envoyée à une autre adresse email."] } };
    }

    inviteRow = invite;
  }

  const supabase = await createClient();

  // Resolve commune: from invite row if available, otherwise from INSEE code
  const communeId = inviteRow?.commune_id;
  let commune: { id: string; access_status: string; trial_max_members: number } | null = null;

  if (communeId) {
    const { data } = await supabase
      .from("communes")
      .select("id, access_status, trial_max_members")
      .eq("id", communeId)
      .single();
    commune = data;
  } else {
    const { data } = await supabase
      .from("communes")
      .select("id, access_status, trial_max_members")
      .eq("insee_code", parsed.data.inseeCode)
      .single();
    commune = data;
  }

  if (!commune || (commune.access_status !== "active" && commune.access_status !== "trial")) {
    return { error: { form: ["Cette commune n'est pas encore active."] } };
  }

  if (commune.access_status === "trial") {
    if (!inviteRow) {
      return {
        error: {
          form: [
            "Cette commune est en période d'essai. Vous devez disposer d'une invitation.",
          ],
        },
      };
    }

    const { count: currentMembers } = await supabase
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("commune_id", commune.id)
      .eq("status", "active");

    if ((currentMembers ?? 0) >= commune.trial_max_members) {
      return {
        error: {
          form: [
            "Le nombre maximum de testeurs pour cette commune a été atteint. Contactez la mairie.",
          ],
        },
      };
    }
  }

  const { data: bannedRow } = await serviceClient
    .from("banned_emails")
    .select("email")
    .eq("email", parsed.data.email)
    .maybeSingle();

  if (bannedRow) {
    return {
      error: {
        form: ["Inscription impossible. Veuillez contacter l'assistance."],
      },
    };
  }

  const { data: adminData, error: adminError } =
    await serviceClient.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: false,
      user_metadata: {
        first_name: parsed.data.firstName,
        last_name: parsed.data.lastName,
      },
    });

  if (adminError || !adminData.user) {
    return {
      error: {
        form: [
          formatAuthError(
            adminError,
            "Inscription impossible pour le moment. Réessayez dans un instant.",
          ),
        ],
      },
    };
  }

  const displayName = formatDisplayName(
    parsed.data.firstName,
    parsed.data.lastName,
  );

  await serviceClient
    .from("profiles")
    .update({
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      display_name: displayName,
      active_commune_id: commune.id,
    })
    .eq("user_id", adminData.user.id);

  const membershipRole = inviteRow?.intended_role ?? "member";

  await serviceClient.from("memberships").insert({
    user_id: adminData.user.id,
    commune_id: commune.id,
    address_street: parsed.data.addressStreet,
    address_lieu_dit: parsed.data.addressLieuDit ?? null,
    address_city: parsed.data.addressCity,
    address_citycode: parsed.data.addressCitycode,
    address_postcode: parsed.data.addressPostcode,
    address_lat: parsed.data.addressLat,
    address_lng: parsed.data.addressLng,
    is_primary: true,
    status: "active",
    role: membershipRole as "member" | "staff" | "mayor",
  });

  // Mark invitation as accepted
  if (inviteRow) {
    await serviceClient
      .from("neighbor_invites")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", inviteRow.id);
  }

  const emailResult = await sendVerificationEmail({
    email: parsed.data.email,
    userName: displayName,
    password: parsed.data.password,
  });

  if (!emailResult.success) {
    void logAudit({
      action: "auth.sign_up",
      category: "auth",
      userId: adminData.user.id,
      communeId: commune.id,
      metadata: { email: parsed.data.email, email_send_warning: true, invite_role: membershipRole },
    });
    return {
      emailConfirmationRequired: true,
      emailSendWarning: true,
    };
  }

  void logAudit({
    action: "auth.sign_up",
    category: "auth",
    userId: adminData.user.id,
    communeId: commune.id,
    metadata: { email: parsed.data.email, invite_role: membershipRole },
  });

  return { emailConfirmationRequired: true };
}

const ALLOWED_REDIRECT_PREFIXES = ["/inscription", "/accueil"];

function sanitizeRedirect(raw: string | null): string | null {
  if (!raw) return null;
  const path = raw.trim();
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  if (ALLOWED_REDIRECT_PREFIXES.some((p) => path.startsWith(p))) return path;
  return null;
}

export async function signIn(formData: FormData) {
  const redirectTo = sanitizeRedirect(formData.get("redirectTo") as string);

  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      error:
        fieldErrors.email?.[0] ??
        fieldErrors.password?.[0] ??
        "Identifiants invalides.",
    };
  }

  const rateLimitKey = `signin:${parsed.data.email.toLowerCase()}`;
  if (!checkRateLimit(rateLimitKey)) {
    void logAudit({
      action: "auth.sign_in_failed",
      category: "auth",
      severity: "warning",
      success: false,
      metadata: { attempted_email: parsed.data.email, reason: "rate_limit" },
    });
    return {
      error: "Trop de tentatives de connexion. Réessayez dans quelques minutes.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) {
    void logAudit({
      action: "auth.sign_in_failed",
      category: "auth",
      severity: "warning",
      success: false,
      metadata: {
        attempted_email: parsed.data.email,
        reason: error.code ?? "invalid_credentials",
      },
    });
    return {
      error: formatAuthError(
        error,
        "Connexion impossible. Vérifiez vos identifiants et réessayez.",
      ),
      emailNotConfirmed: error.code === "email_not_confirmed",
    };
  }

  resetRateLimit(rateLimitKey);

  // Check if the user is platform-banned after successful auth
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("banned_at")
      .eq("user_id", user.id)
      .single();

    if (profile?.banned_at) {
      await supabase.auth.signOut();
      void logAudit({
        action: "auth.sign_in_failed",
        category: "auth",
        severity: "warning",
        userId: user.id,
        success: false,
        metadata: { attempted_email: parsed.data.email, reason: "banned" },
      });
      // Retrieve support email for the error message
      const serviceClient = await createServiceClient();
      const { data: settings } = await serviceClient
        .from("platform_settings")
        .select("support_email")
        .eq("id", 1)
        .single();
      const supportEmail = settings?.support_email ?? "contact@tous-voisins.fr";
      return {
        error: `Votre compte a été suspendu. Contactez l'assistance : ${supportEmail}`,
      };
    }
  }

  void logAudit({
    action: "auth.sign_in",
    category: "auth",
    userId: user?.id,
    metadata: { email: parsed.data.email },
  });

  redirect(redirectTo ?? ROUTES.accueil);
}

export async function requestPasswordReset(formData: FormData) {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      error:
        parsed.error.flatten().fieldErrors.email?.[0] ?? "Email invalide",
    };
  }

  const supabase = await createClient();
  // type=recovery is preserved when Supabase redirects back with ?code=… (PKCE flow).
  const redirectTo = `${getAppUrl()}${ROUTES.authCallback}?type=recovery`;

  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    { redirectTo },
  );

  if (error && isRateLimitError(error)) {
    return {
      error: formatAuthError(
        error,
        "Trop de demandes envoyées. Patientez quelques instants et réessayez.",
      ),
    };
  }

  void logAudit({
    action: "auth.request_password_reset",
    category: "auth",
    metadata: { email: parsed.data.email },
  });

  return { success: true as const };
}

export async function resendVerificationEmail(formData: FormData) {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      error:
        parsed.error.flatten().fieldErrors.email?.[0] ?? "Email invalide",
    };
  }

  const normalizedEmail = parsed.data.email.toLowerCase();
  const rateLimitKey = `resend-verification:${normalizedEmail}`;
  if (!checkRateLimit(rateLimitKey)) {
    return {
      error: "Trop de demandes envoyées. Patientez quelques instants et réessayez.",
    };
  }

  const result = await resendVerificationEmailIfNeeded(normalizedEmail);

  if (!result.success && result.error) {
    if (isRateLimitError({ message: result.error })) {
      return {
        error: formatAuthError(
          { message: result.error },
          "Trop de demandes envoyées. Patientez quelques instants et réessayez.",
        ),
      };
    }

    console.error("[auth] resendVerificationEmail failed:", result.error);
  }

  return { success: true as const };
}

export async function updatePassword(formData: FormData) {
  const cookieStore = await cookies();
  if (!cookieStore.get(RECOVERY_COOKIE_NAME)) {
    return {
      error: "Lien expiré ou invalide. Demandez un nouveau mot de passe.",
    };
  }

  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      error:
        fieldErrors.password?.[0] ??
        fieldErrors.confirmPassword?.[0] ??
        "Les informations saisies sont invalides.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Session expirée. Demandez un nouveau lien." };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return {
      error: formatAuthError(
        error,
        "Impossible de mettre à jour le mot de passe.",
      ),
    };
  }

  cookieStore.delete(RECOVERY_COOKIE_NAME);

  void logAudit({
    action: "auth.reset_password",
    category: "auth",
    severity: "warning",
    userId: user.id,
  });

  redirect(ROUTES.accueil);
}

export type AuthActionResult = { success: true } | { error: string };

export async function requestEmailChange(
  newEmail: string,
): Promise<AuthActionResult> {
  const parsed = emailChangeSchema.safeParse({ email: newEmail });
  if (!parsed.success) {
    return {
      error: parsed.error.flatten().fieldErrors.email?.[0] ?? "Email invalide",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Session expirée." };
  }

  if (user.email?.toLowerCase() === parsed.data.email.toLowerCase()) {
    return { error: "Cette adresse e-mail est déjà la vôtre." };
  }

  const userName =
    (typeof user.user_metadata?.first_name === "string"
      ? user.user_metadata.first_name
      : null) ??
    user.email?.split("@")[0] ??
    "Bonjour";

  const result = await sendEmailChangeVerification({
    email: user.email ?? "",
    newEmail: parsed.data.email,
    userName,
  });

  if (!result.success) {
    return {
      error: result.error ?? "Impossible de modifier l'email.",
    };
  }

  void logAudit({
    action: "auth.request_email_change",
    category: "auth",
    severity: "warning",
    userId: user.id,
    metadata: { new_email: parsed.data.email },
  });

  return { success: true };
}

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<AuthActionResult> {
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      error:
        fieldErrors.currentPassword?.[0] ??
        fieldErrors.newPassword?.[0] ??
        fieldErrors.confirmPassword?.[0] ??
        "Les informations saisies sont invalides.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: "Session expirée." };
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });

  if (verifyError) {
    return { error: "Mot de passe actuel incorrect." };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });

  if (error) {
    return {
      error: formatAuthError(
        error,
        "Impossible de modifier le mot de passe.",
      ),
    };
  }

  void logAudit({
    action: "auth.change_password",
    category: "auth",
    severity: "warning",
    userId: user.id,
  });

  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  void logAudit({
    action: "auth.sign_out",
    category: "auth",
    userId: user?.id,
  });
  await supabase.auth.signOut();
  redirect(ROUTES.home);
}

export async function submitCommuneInterest(formData: FormData) {
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  const rateLimitKey = `commune-interest:${ip}`;
  if (!checkRateLimit(rateLimitKey, 5, 10 * 60 * 1000)) {
    return {
      error: "Trop de demandes. Réessayez dans quelques minutes.",
    };
  }

  const rawInsee = (formData.get("inseeCode") as string)?.trim();
  const emailRaw = (formData.get("email") as string)?.trim();
  const message = (formData.get("message") as string)?.trim() || null;
  const city = (formData.get("city") as string)?.trim() || null;
  const label = (formData.get("label") as string)?.trim() || null;

  if (!rawInsee) return { error: "Code commune manquant" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = emailRaw || user?.email?.trim() || "";
  if (!email) {
    return { error: "Indiquez une adresse e-mail pour être recontacté·e." };
  }

  const { data: commune } = await supabase
    .from("communes")
    .select("id")
    .eq("insee_code", rawInsee)
    .maybeSingle();

  const metadata: Record<string, string> = { source: "inscription" };
  if (city) metadata.city = city;
  if (label) metadata.label = label;
  if (user) metadata.user_id = user.id;

  const { error } = await supabase.from("commune_interest_leads").insert({
    commune_id: commune?.id ?? null,
    insee_code: rawInsee,
    email,
    message,
    metadata,
  });

  if (error) {
    return {
      error:
        "Enregistrement impossible pour le moment. Réessayez dans un instant.",
    };
  }

  revalidatePath(ROUTES.inscription.root);
  revalidatePath("/backoffice", "layout");
  return { success: true };
}

export async function switchCommune(communeId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.connexion);

  const { data: membership } = await supabase
    .from("memberships")
    .select("status")
    .eq("user_id", user.id)
    .eq("commune_id", communeId)
    .single();

  if (membership?.status === "suspended") {
    await supabase
      .from("profiles")
      .update({ active_commune_id: communeId })
      .eq("user_id", user.id);
    redirect(ROUTES.suspendu);
  }

  if (membership?.status !== "active") {
    return;
  }

  await supabase
    .from("profiles")
    .update({ active_commune_id: communeId })
    .eq("user_id", user.id);

  revalidatePath("/", "layout");
  redirect(ROUTES.accueil);
}

export async function joinCommune(formData: FormData) {
  const raw = {
    inseeCode: formData.get("inseeCode") as string,
    addressStreet: formData.get("addressStreet") as string,
    addressCity: formData.get("addressCity") as string,
    addressCitycode: formData.get("addressCitycode") as string,
    addressPostcode: formData.get("addressPostcode") as string,
    addressLat: Number(formData.get("addressLat")),
    addressLng: Number(formData.get("addressLng")),
  };

  const parsed = joinCommuneSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.connexion);

  const { data: commune } = await supabase
    .from("communes")
    .select("id, access_status, trial_max_members")
    .eq("insee_code", parsed.data.inseeCode)
    .single();

  if (!commune || (commune.access_status !== "active" && commune.access_status !== "trial")) {
    return { error: { form: ["Cette commune n'est pas encore active."] } };
  }

  if (commune.access_status === "trial") {
    return {
      error: {
        form: [
          "Cette commune est en période d'essai. Contactez la mairie pour recevoir une invitation.",
        ],
      },
    };
  }

  const { data: existing } = await supabase
    .from("memberships")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("commune_id", commune.id)
    .maybeSingle();

  if (existing?.status === "suspended") {
    await supabase
      .from("profiles")
      .update({ active_commune_id: commune.id })
      .eq("user_id", user.id);
    redirect(ROUTES.suspendu);
  }

  if (existing?.status === "active") {
    await supabase
      .from("profiles")
      .update({ active_commune_id: commune.id })
      .eq("user_id", user.id);
    revalidatePath("/", "layout");
    redirect(ROUTES.accueil);
  }

  const membershipPayload = {
    address_street: parsed.data.addressStreet,
    address_city: parsed.data.addressCity,
    address_citycode: parsed.data.addressCitycode,
    address_postcode: parsed.data.addressPostcode,
    address_lat: parsed.data.addressLat,
    address_lng: parsed.data.addressLng,
    status: "active" as const,
  };

  if (existing) {
    await supabase
      .from("memberships")
      .update(membershipPayload)
      .eq("id", existing.id);
  } else {
    await supabase.from("memberships").insert({
      user_id: user.id,
      commune_id: commune.id,
      is_primary: false,
      ...membershipPayload,
    });
  }

  await supabase
    .from("profiles")
    .update({ active_commune_id: commune.id })
    .eq("user_id", user.id);

  void logAudit({
    action: "auth.join_commune",
    category: "auth",
    userId: user.id,
    communeId: commune.id,
    metadata: { insee_code: parsed.data.inseeCode },
  });

  revalidatePath("/", "layout");
  redirect(ROUTES.accueil);
}
