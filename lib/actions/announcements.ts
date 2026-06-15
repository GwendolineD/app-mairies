"use server";

import { revalidatePath } from "next/cache";
import { assertAuthorMembership } from "@/lib/auth/ownership";
import { requireActiveMembership } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import {
  ANNOUNCEMENT_STATUS,
  type AnnouncementStatusValue,
} from "@/lib/constants/statuses";
import {
  listAnnouncementsPage,
  type AnnouncementListFilters,
} from "@/lib/queries/announcements";
import { createClient } from "@/lib/supabase/server";
import { announcementSchema } from "@/lib/validations/schemas";
import { isAnnouncementType, type AnnouncementType } from "@/lib/constants/announcement-types";
import { fanoutNewContentNotification } from "@/lib/services/notification-fanout";

type AnnouncementStatusUpdate = Extract<
  AnnouncementStatusValue,
  "pourvue" | "archivee" | "ouverte"
>;

export async function createAnnouncement(formData: FormData): Promise<{ id: string }> {
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
  if (!parsed.success) {
    throw new Error("Les données du formulaire sont invalides.");
  }

  const membership = ctx.activeMembership!;
  const supabase = await createClient();
  const { data: created, error } = await supabase.from("announcements").insert({
    commune_id: membership.commune_id,
    author_membership_id: membership.id,
    type: parsed.data.type,
    category_slug: parsed.data.categorySlug,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    target_date: parsed.data.targetDate || null,
    photo_url: parsed.data.photoUrl || null,
    status: ANNOUNCEMENT_STATUS.ouverte,
    address_lat: membership.address_lat,
    address_lng: membership.address_lng,
  }).select("id").single();

  if (error) {
    if (error.code === "23503") {
      throw new Error("Catégorie non reconnue. Réessayez ou choisissez une autre catégorie.");
    }
    throw new Error("Impossible de publier l'annonce.");
  }
  revalidatePath(ROUTES.annonces.list);
  revalidatePath(ROUTES.accueil);
  revalidatePath(ROUTES.annonces.detail(created.id));

  // Fanout "new announcement" notification to opted-in commune members (best-effort).
  void fanoutNewContentNotification({
    contextType: "announcement",
    contextId: created.id,
    communeId: membership.commune_id,
    authorUserId: ctx.userId,
    title: parsed.data.title,
    authorDisplayName: ctx.profile.display_name,
  });

  return { id: created.id };
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

export async function fetchAnnouncementsPage(
  cursor: string | null,
  filters: {
    type?: string;
    categories?: string[];
    date?: string;
    dateValue?: string;
  },
) {
  const ctx = await requireActiveMembership();
  const dateRaw = filters.date;
  const date =
    dateRaw === "today" ||
    dateRaw === "next7days" ||
    dateRaw === "none" ||
    dateRaw === "custom"
      ? dateRaw
      : undefined;

  const listFilters: AnnouncementListFilters = {
    communeId: ctx.activeMembership!.commune_id,
    type: isAnnouncementType(filters.type ?? "")
      ? (filters.type as AnnouncementType)
      : undefined,
    categories: filters.categories?.filter(Boolean),
    date,
    dateValue:
      date === "custom" && filters.dateValue ? filters.dateValue : undefined,
  };

  const supabase = await createClient();
  return listAnnouncementsPage(supabase, listFilters, { cursor });
}
