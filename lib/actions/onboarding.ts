"use server";

import { revalidatePath } from "next/cache";
import { requireActiveMembership } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function markOnboardingSeen(): Promise<void> {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();

  await supabase
    .from("profiles")
    .update({ has_seen_onboarding: true })
    .eq("user_id", ctx.userId);

  revalidatePath("/accueil");
}
