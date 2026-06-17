"use server";

import { revalidatePath } from "next/cache";
import { requireActiveMembership } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";
import { profileUpdateSchema } from "@/lib/validations/schemas";

export async function updateProfile(formData: FormData): Promise<void> {
  const ctx = await requireActiveMembership();
  const raw = {
    displayName: formData.get("displayName") as string,
    bio: (formData.get("bio") as string) || undefined,
    avatarUrl: (formData.get("avatarUrl") as string) || "",
  };

  const parsed = profileUpdateSchema.safeParse(raw);
  if (!parsed.success) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      bio: parsed.data.bio ?? null,
      avatar_url: parsed.data.avatarUrl || null,
    })
    .eq("user_id", ctx.userId);

  if (error) return;
  revalidatePath(ROUTES.profil);
}
