"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";

type UpdateInput = {
  supportEmail: string;
};

export async function updatePlatformSettings(
  input: UpdateInput,
): Promise<{ success: boolean; error?: string }> {
  await requirePlatformAdmin();

  if (!input.supportEmail || !input.supportEmail.includes("@")) {
    return { success: false, error: "Email invalide." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("platform_settings")
    .update({
      support_email: input.supportEmail,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(ROUTES.backoffice.settings);
  return { success: true };
}

export async function getPlatformSupportEmail(): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("platform_settings")
    .select("support_email")
    .eq("id", 1)
    .single();
  return data?.support_email ?? "contact@tous-voisins.fr";
}
