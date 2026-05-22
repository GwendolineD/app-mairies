"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveMembership } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { announcementSchema } from "@/lib/validations/schemas";

export async function createAnnouncement(formData: FormData): Promise<void> {
  const ctx = await requireActiveMembership();
  const raw = {
    type: formData.get("type") as string,
    categorySlug: formData.get("categorySlug") as string,
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
    targetDate: (formData.get("targetDate") as string) || undefined,
    photoUrl: (formData.get("photoUrl") as string) || "",
  };

  const parsed = announcementSchema.safeParse(raw);
  if (!parsed.success) return;

  const supabase = await createClient();
  const { error } = await supabase.from("announcements").insert({
    commune_id: ctx.activeMembership!.commune_id,
    author_membership_id: ctx.activeMembership!.id,
    type: parsed.data.type,
    category_slug: parsed.data.categorySlug,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    target_date: parsed.data.targetDate || null,
    photo_url: parsed.data.photoUrl || null,
    status: "ouverte",
  });

  if (error) return;
  revalidatePath("/annonces");
  redirect("/annonces");
}

export async function updateAnnouncementStatus(
  id: string,
  status: "pourvue" | "archivee" | "ouverte",
) {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();

  const { data: ann } = await supabase
    .from("announcements")
    .select("author_membership_id")
    .eq("id", id)
    .single();

  if (ann?.author_membership_id !== ctx.activeMembership!.id) {
    return { error: "Non autorisé" };
  }

  const { error } = await supabase
    .from("announcements")
    .update({ status })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/annonces");
  revalidatePath(`/annonces/${id}`);
  return { success: true };
}

export async function deleteAnnouncement(id: string) {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();

  const { data: ann } = await supabase
    .from("announcements")
    .select("author_membership_id")
    .eq("id", id)
    .single();

  if (ann?.author_membership_id !== ctx.activeMembership!.id) {
    return { error: "Non autorisé" };
  }

  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/annonces");
  return { success: true };
}
