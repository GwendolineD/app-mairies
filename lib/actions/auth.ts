"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signupSchema } from "@/lib/validations/schemas";
import { formatDisplayName } from "@/lib/types";

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
    return { error: { form: [authError?.message ?? "Inscription impossible"] } };
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

  redirect("/accueil");
}

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  redirect("/accueil");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function submitCommuneInterest(formData: FormData) {
  const rawInsee = (formData.get("inseeCode") as string)?.trim();
  const emailRaw = (formData.get("email") as string)?.trim();
  const message = (formData.get("message") as string)?.trim() || null;

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
    .single();

  if (!commune) return { error: "Commune introuvable" };

  const { error } = await supabase.from("commune_interest_leads").insert({
    commune_id: commune.id,
    insee_code: rawInsee,
    email,
    message,
    metadata: user ? { user_id: user.id } : {},
  });

  if (error) return { error: error.message };

  revalidatePath("/inscription");
  return { success: true };
}

export async function switchCommune(communeId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

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
    redirect("/suspendu");
  }

  if (membership?.status !== "active") {
    return;
  }

  await supabase
    .from("profiles")
    .update({ active_commune_id: communeId })
    .eq("user_id", user.id);

  revalidatePath("/", "layout");
  redirect("/accueil");
}
