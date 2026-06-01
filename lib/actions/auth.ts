"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { RECOVERY_COOKIE_NAME } from "@/lib/constants/auth";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/utils/app-url";
import { formatAuthError } from "@/lib/utils/auth-errors";
import { formatDisplayName } from "@/lib/utils/display-name";
import {
  forgotPasswordSchema,
  joinCommuneSchema,
  resetPasswordSchema,
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
    addressLabel: formData.get("addressLabel") as string,
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

  const supabase = await createClient();
  const { data: commune } = await supabase
    .from("communes")
    .select("id, subscription_status")
    .eq("insee_code", parsed.data.inseeCode)
    .single();

  if (!commune || commune.subscription_status !== "active") {
    return { error: { form: ["Cette commune n'est pas encore active."] } };
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (authError || !authData.user) {
    return {
      error: {
        form: [
          formatAuthError(
            authError,
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

  await supabase
    .from("profiles")
    .update({
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      display_name: displayName,
      active_commune_id: commune.id,
    })
    .eq("user_id", authData.user.id);

  await supabase.from("memberships").insert({
    user_id: authData.user.id,
    commune_id: commune.id,
    address_label: parsed.data.addressLabel,
    address_citycode: parsed.data.addressCitycode,
    address_postcode: parsed.data.addressPostcode,
    address_lat: parsed.data.addressLat,
    address_lng: parsed.data.addressLng,
    is_primary: true,
    status: "active",
  });

  redirect(ROUTES.accueil);
}

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return {
      error: formatAuthError(
        error,
        "Connexion impossible. Vérifiez vos identifiants et réessayez.",
      ),
    };
  }

  redirect(ROUTES.accueil);
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
  const redirectTo = `${getAppUrl()}${ROUTES.authCallback}`;

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
  redirect(ROUTES.accueil);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(ROUTES.home);
}

export async function submitCommuneInterest(formData: FormData) {
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
    addressLabel: formData.get("addressLabel") as string,
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
    .select("id, subscription_status")
    .eq("insee_code", parsed.data.inseeCode)
    .single();

  if (!commune || commune.subscription_status !== "active") {
    return { error: { form: ["Cette commune n'est pas encore active."] } };
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
    address_label: parsed.data.addressLabel,
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

  revalidatePath("/", "layout");
  redirect(ROUTES.accueil);
}
