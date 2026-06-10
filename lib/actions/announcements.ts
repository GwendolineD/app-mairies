"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAuthorMembership } from "@/lib/auth/ownership";
import { requireActiveMembership } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import {
  ANNOUNCEMENT_STATUS,
  type AnnouncementStatusValue,
} from "@/lib/constants/statuses";
import { createClient } from "@/lib/supabase/server";
import { announcementSchema } from "@/lib/validations/schemas";

type AnnouncementStatusUpdate = Extract<
  AnnouncementStatusValue,
  "pourvue" | "archivee" | "ouverte"
>;

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
  const redirectTo = (formData.get("redirectTo") as string) || ROUTES.annonces.list;
  const safeRedirectTo = redirectTo.startsWith("/") ? redirectTo : ROUTES.annonces.list;

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
    status: ANNOUNCEMENT_STATUS.ouverte,
  });

  if (error) return;
  revalidatePath(ROUTES.annonces.list);
  revalidatePath(ROUTES.profil);
  redirect(safeRedirectTo);
}

export async function updateAnnouncementStatus(
  id: string,
  status: AnnouncementStatusUpdate,
) {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();

  const auth = await assertAuthorMembership(
    supabase,
    "announcements",
    id,
    ctx.activeMembership!.id,
  );
  if (auth.error) return auth;

  const { error } = await supabase
    .from("announcements")
    .update({ status })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(ROUTES.annonces.list);
  revalidatePath(ROUTES.annonces.detail(id));
  return { success: true };
}

export async function deleteAnnouncement(id: string) {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();

  const auth = await assertAuthorMembership(
    supabase,
    "announcements",
    id,
    ctx.activeMembership!.id,
  );
  if (auth.error) return auth;

  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(ROUTES.annonces.list);
  return { success: true };
}
