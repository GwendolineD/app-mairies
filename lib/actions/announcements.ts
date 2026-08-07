"use server";

import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit/log";
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
import type { OutcomeReason } from "@/lib/constants/content-outcomes";
import {
  firstZodIssueMessage,
  formatPostgrestError,
} from "@/lib/utils/supabase-errors";
import { fanoutNewContentNotification } from "@/lib/services/notification-fanout";
import { incrementMembershipPublishCounter } from "@/lib/services/membership-publish-counters";
import { cancelPendingEmails } from "@/lib/cron/cancel-pending-emails";

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
    addressStreet: formData.get("addressStreet") as string,
    addressCity: formData.get("addressCity") as string,
    addressCitycode: formData.get("addressCitycode") as string,
    addressPostcode: formData.get("addressPostcode") as string,
    addressLat: Number(formData.get("addressLat")),
    addressLng: Number(formData.get("addressLng")),
  };

  const parsed = announcementSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(firstZodIssueMessage(parsed.error.issues));
  }

  const membership = ctx.activeMembership!;
  const supabase = await createClient();
  const photoUrl = parsed.data.photoUrl || null;
  const { data: created, error } = await supabase.from("announcements").insert({
    commune_id: membership.commune_id,
    author_membership_id: membership.id,
    type: parsed.data.type,
    category_slug: parsed.data.categorySlug,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    target_date: parsed.data.targetDate || null,
    photo_url: photoUrl,
    status: ANNOUNCEMENT_STATUS.ouverte,
    address_street: parsed.data.addressStreet,
    address_city: parsed.data.addressCity,
    address_citycode: parsed.data.addressCitycode,
    address_postcode: parsed.data.addressPostcode,
    address_lat: parsed.data.addressLat,
    address_lng: parsed.data.addressLng,
  }).select("id").single();

  if (error) {
    console.error("[createAnnouncement] insert failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(
      formatPostgrestError(
        error,
        "Impossible de publier l'annonce. Vérifiez votre adresse et réessayez.",
      ),
    );
  }
  revalidatePath(ROUTES.annonces.list);
  revalidatePath(ROUTES.accueil);
  revalidatePath(ROUTES.annonces.detail(created.id));
  revalidatePath(ROUTES.profil);

  incrementMembershipPublishCounter(
    supabase,
    membership.id,
    "total_announcements_published",
    { logContext: "createAnnouncement" },
  );

  void fanoutNewContentNotification({
    contextType: "announcement",
    contextId: created.id,
    communeId: membership.commune_id,
    authorUserId: ctx.userId,
    title: parsed.data.title,
    authorDisplayName: ctx.profile.display_name,
  });

  void logAudit({
    action: "content.create_announcement",
    category: "content",
    userId: ctx.userId,
    targetType: "announcement",
    targetId: created.id,
    communeId: membership.commune_id,
  });

  return { id: created.id };
}

export async function updateAnnouncement(
  id: string,
  formData: FormData,
): Promise<{ success: true } | { error: string }> {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();

  const auth = await assertAuthorMembership(
    supabase,
    "announcements",
    id,
    ctx.activeMembership!.id,
  );
  if (auth.error) return { error: auth.error };

  const raw = {
    type: formData.get("type") as string,
    categorySlug: formData.get("categorySlug") as string,
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
    targetDate: (formData.get("targetDate") as string) || undefined,
    photoUrl: (formData.get("photoUrl") as string) || "",
    addressStreet: formData.get("addressStreet") as string,
    addressCity: formData.get("addressCity") as string,
    addressCitycode: formData.get("addressCitycode") as string,
    addressPostcode: formData.get("addressPostcode") as string,
    addressLat: Number(formData.get("addressLat")),
    addressLng: Number(formData.get("addressLng")),
  };

  const parsed = announcementSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: firstZodIssueMessage(parsed.error.issues) };
  }

  const photoUrl = parsed.data.photoUrl || null;

  const { error } = await supabase
    .from("announcements")
    .update({
      type: parsed.data.type,
      category_slug: parsed.data.categorySlug,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      target_date: parsed.data.targetDate || null,
      photo_url: photoUrl,
      address_street: parsed.data.addressStreet,
      address_city: parsed.data.addressCity,
      address_citycode: parsed.data.addressCitycode,
      address_postcode: parsed.data.addressPostcode,
      address_lat: parsed.data.addressLat,
      address_lng: parsed.data.addressLng,
    })
    .eq("id", id);

  if (error) {
    return {
      error: formatPostgrestError(
        error,
        "Impossible de modifier l'annonce. Réessayez.",
      ),
    };
  }

  revalidatePath(ROUTES.annonces.list);
  revalidatePath(ROUTES.annonces.detail(id));
  revalidatePath(ROUTES.accueil);

  void logAudit({
    action: "content.update_announcement",
    category: "content",
    userId: ctx.userId,
    targetType: "announcement",
    targetId: id,
    communeId: ctx.activeMembership!.commune_id,
  });

  return { success: true };
}

export async function softDeleteAnnouncement(
  id: string,
  outcome: OutcomeReason,
): Promise<{ success: true } | { error: string }> {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();

  const auth = await assertAuthorMembership(
    supabase,
    "announcements",
    id,
    ctx.activeMembership!.id,
  );
  if (auth.error) return { error: auth.error };

  const { data: ann, error: fetchError } = await supabase
    .from("announcements")
    .select("type, category_slug, commune_id")
    .eq("id", id)
    .single();

  if (fetchError) return { error: fetchError.message };

  const { error: outcomeError } = await supabase.from("content_outcomes").insert({
    commune_id: ann.commune_id,
    membership_id: ctx.activeMembership!.id,
    content_kind: "announcement",
    content_type: ann.type,
    category_slug: ann.category_slug,
    outcome,
  });

  if (outcomeError) return { error: outcomeError.message };

  const { error } = await supabase
    .from("announcements")
    .update({
      status: ANNOUNCEMENT_STATUS.archivee,
      archived_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(ROUTES.annonces.list);
  revalidatePath(ROUTES.annonces.detail(id));
  revalidatePath(ROUTES.accueil);
  revalidatePath(ROUTES.mairie.dashboard);

  void cancelPendingEmails("announcement", id);

  void logAudit({
    action: "content.delete_announcement",
    category: "content",
    userId: ctx.userId,
    targetType: "announcement",
    targetId: id,
    communeId: ctx.activeMembership!.commune_id,
    metadata: { soft_delete: true, outcome },
  });

  return { success: true };
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
  if (auth.error) return { error: auth.error };

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
  if (auth.error) return { error: auth.error };

  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) return { error: error.message };

  void logAudit({
    action: "content.delete_announcement",
    category: "content",
    userId: ctx.userId,
    targetType: "announcement",
    targetId: id,
    communeId: ctx.activeMembership!.commune_id,
  });

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
    sortMode?: "recent" | "oldest";
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
  return listAnnouncementsPage(supabase, listFilters, { cursor, sortMode: filters.sortMode });
}
