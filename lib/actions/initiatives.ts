"use server";

import { revalidatePath } from "next/cache";
import { assertAuthorMembership } from "@/lib/auth/ownership";
import { requireActiveMembership } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { INITIATIVE_STATUS } from "@/lib/constants/statuses";
import { EVENT_STATUS } from "@/lib/constants/statuses";
import { getInitiativeCategoryDefaultImageUrl } from "@/lib/constants/initiative-categories";
import { createClient } from "@/lib/supabase/server";
import { parseFormId } from "@/lib/utils/form-data";
import { firstZodIssueMessage } from "@/lib/utils/supabase-errors";
import {
  initiativeSchema,
  createEventFromInitiativeSchema,
} from "@/lib/validations/schemas";
import { fanoutNewContentNotification } from "@/lib/services/notification-fanout";
import {
  listInitiativesPage,
  INITIATIVES_PAGE_SIZE,
} from "@/lib/queries/initiatives";

export async function fetchInitiativesPage(
  cursor: string | null,
  filters: {
    categorie?: string;
  },
) {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();

  return listInitiativesPage(
    supabase,
    {
      communeId: ctx.activeMembership!.commune_id,
      categorie: filters.categorie,
    },
    { cursor, limit: INITIATIVES_PAGE_SIZE },
  );
}

export async function createInitiative(formData: FormData): Promise<{ id: string }> {
  const ctx = await requireActiveMembership();
  const membership = ctx.activeMembership!;
  const raw = {
    categorySlug: formData.get("categorySlug") as string,
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
    photoUrl: (formData.get("photoUrl") as string) || undefined,
    addressStreet: (formData.get("addressStreet") as string) || undefined,
    addressCity: (formData.get("addressCity") as string) || undefined,
    addressPostcode: (formData.get("addressPostcode") as string) || undefined,
    addressCitycode: (formData.get("addressCitycode") as string) || undefined,
    addressLat: formData.get("addressLat") as string,
    addressLng: formData.get("addressLng") as string,
  };
  const parsed = initiativeSchema.safeParse(raw);
  if (!parsed.success) throw new Error("Données invalides");

  const supabase = await createClient();

  const streetFromForm = parsed.data.addressStreet?.trim();
  const cityFromForm = parsed.data.addressCity?.trim();
  const hasFormAddress =
    !!streetFromForm &&
    !!cityFromForm &&
    parsed.data.addressLat != null &&
    parsed.data.addressLng != null;

  const addressLabel = hasFormAddress
    ? [streetFromForm, cityFromForm].filter(Boolean).join(", ")
    : (membership.address_street ?? membership.address_city);
  const addressLat = hasFormAddress
    ? parsed.data.addressLat!
    : membership.address_lat;
  const addressLng = hasFormAddress
    ? parsed.data.addressLng!
    : membership.address_lng;

  const photoUrl = parsed.data.photoUrl || getInitiativeCategoryDefaultImageUrl(parsed.data.categorySlug);

  const { data: created, error } = await supabase
    .from("initiatives")
    .insert({
      commune_id: membership.commune_id,
      author_membership_id: membership.id,
      category_slug: parsed.data.categorySlug,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      photo_url: photoUrl,
      date_mode: "none",
      address_label: addressLabel,
      address_lat: addressLat,
      address_lng: addressLng,
      status: INITIATIVE_STATUS.active,
    })
    .select("id")
    .single();

  if (error || !created) throw new Error("Impossible de créer l'initiative");

  // Create linked event if event fields are provided
  const eventStartsAt = formData.get("eventStartsAt") as string | null;
  const eventEndsAt = formData.get("eventEndsAt") as string | null;
  if (eventStartsAt && eventEndsAt) {
    const volunteersNeeded = formData.get("eventVolunteersNeeded") as string | null;
    await supabase.from("events").insert({
      commune_id: membership.commune_id,
      author_membership_id: membership.id,
      source_initiative_id: created.id,
      category_slug: parsed.data.categorySlug,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      photo_url: photoUrl,
      starts_at: new Date(eventStartsAt).toISOString(),
      ends_at: new Date(eventEndsAt).toISOString(),
      volunteers_needed: volunteersNeeded ? parseInt(volunteersNeeded, 10) : null,
      address_label: addressLabel,
      address_lat: addressLat,
      address_lng: addressLng,
      status: EVENT_STATUS.active,
    });
    revalidatePath(ROUTES.evenements.list);
  }

  revalidatePath(ROUTES.initiatives.list);

  void fanoutNewContentNotification({
    contextType: "initiative",
    contextId: created.id,
    communeId: membership.commune_id,
    authorUserId: ctx.userId,
    title: parsed.data.title,
    authorDisplayName: ctx.profile.display_name,
  });

  return { id: created.id };
}

export async function updateInitiative(
  id: string,
  formData: FormData,
): Promise<{ success: true } | { error: string }> {
  const ctx = await requireActiveMembership();
  const membership = ctx.activeMembership!;
  const supabase = await createClient();

  const auth = await assertAuthorMembership(
    supabase,
    "initiatives",
    id,
    membership.id,
  );
  if (auth.error) return { error: auth.error };

  const raw = {
    categorySlug: formData.get("categorySlug") as string,
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
    photoUrl: (formData.get("photoUrl") as string) || "",
    addressStreet: (formData.get("addressStreet") as string) || undefined,
    addressCity: (formData.get("addressCity") as string) || undefined,
    addressPostcode: (formData.get("addressPostcode") as string) || undefined,
    addressCitycode: (formData.get("addressCitycode") as string) || undefined,
    addressLat: formData.get("addressLat") as string,
    addressLng: formData.get("addressLng") as string,
  };
  const parsed = initiativeSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: firstZodIssueMessage(parsed.error.issues) };
  }

  const streetFromForm = parsed.data.addressStreet?.trim();
  const cityFromForm = parsed.data.addressCity?.trim();
  const hasFormAddress =
    !!streetFromForm &&
    !!cityFromForm &&
    parsed.data.addressLat != null &&
    parsed.data.addressLng != null;

  const addressLabel = hasFormAddress
    ? [streetFromForm, cityFromForm].filter(Boolean).join(", ")
    : (membership.address_street ?? membership.address_city);
  const addressLat = hasFormAddress
    ? parsed.data.addressLat!
    : membership.address_lat;
  const addressLng = hasFormAddress
    ? parsed.data.addressLng!
    : membership.address_lng;

  const photoUrl =
    parsed.data.photoUrl || getInitiativeCategoryDefaultImageUrl(parsed.data.categorySlug);

  const { error } = await supabase
    .from("initiatives")
    .update({
      category_slug: parsed.data.categorySlug,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      photo_url: photoUrl,
      address_label: addressLabel,
      address_lat: addressLat,
      address_lng: addressLng,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  const { data: linkedEvent } = await supabase
    .from("events")
    .select("id")
    .eq("source_initiative_id", id)
    .eq("status", EVENT_STATUS.active)
    .maybeSingle();

  if (linkedEvent) {
    await supabase
      .from("events")
      .update({
        category_slug: parsed.data.categorySlug,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        photo_url: photoUrl,
        address_label: addressLabel,
        address_lat: addressLat,
        address_lng: addressLng,
      })
      .eq("id", linkedEvent.id);
    revalidatePath(ROUTES.evenements.detail(linkedEvent.id));
    revalidatePath(ROUTES.evenements.list);
  }

  revalidatePath(ROUTES.initiatives.list);
  revalidatePath(ROUTES.initiatives.detail(id));
  return { success: true };
}

export async function createEventFromInitiative(formData: FormData): Promise<string | null> {
  const ctx = await requireActiveMembership();
  const membership = ctx.activeMembership!;

  const raw = {
    initiativeId: formData.get("initiativeId") as string,
    startsAt: formData.get("startsAt") as string,
    endsAt: formData.get("endsAt") as string,
    volunteersNeeded: formData.get("volunteersNeeded") as string,
  };

  const parsed = createEventFromInitiativeSchema.safeParse(raw);
  if (!parsed.success) return null;

  const supabase = await createClient();

  const { data: initiative } = await supabase
    .from("initiatives")
    .select("title, description, category_slug, address_label, address_lat, address_lng, photo_url")
    .eq("id", parsed.data.initiativeId)
    .eq("commune_id", membership.commune_id)
    .single();

  if (!initiative) return null;

  const { data: created, error } = await supabase
    .from("events")
    .insert({
      commune_id: membership.commune_id,
      author_membership_id: membership.id,
      source_initiative_id: parsed.data.initiativeId,
      category_slug: initiative.category_slug,
      title: initiative.title,
      description: initiative.description,
      photo_url: initiative.photo_url,
      starts_at: new Date(parsed.data.startsAt).toISOString(),
      ends_at: new Date(parsed.data.endsAt).toISOString(),
      volunteers_needed: parsed.data.volunteersNeeded ?? null,
      address_label: initiative.address_label,
      address_lat: initiative.address_lat,
      address_lng: initiative.address_lng,
      status: EVENT_STATUS.active,
    })
    .select("id")
    .single();

  if (error || !created) return null;

  revalidatePath(ROUTES.evenements.list);
  revalidatePath(ROUTES.initiatives.detail(parsed.data.initiativeId));

  void fanoutNewContentNotification({
    contextType: "event",
    contextId: created.id,
    communeId: membership.commune_id,
    authorUserId: ctx.userId,
    title: initiative.title,
    authorDisplayName: ctx.profile.display_name,
  });

  return created.id;
}

export async function updateInitiativeStatus(
  id: string,
  status: (typeof INITIATIVE_STATUS)[keyof typeof INITIATIVE_STATUS],
) {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();

  const auth = await assertAuthorMembership(
    supabase,
    "initiatives",
    id,
    ctx.activeMembership!.id,
  );
  if (auth.error) return { error: auth.error };

  const { error } = await supabase
    .from("initiatives")
    .update({ status })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(ROUTES.initiatives.list);
  revalidatePath(ROUTES.initiatives.detail(id));
  return { success: true };
}

export async function toggleInitiativeSupport(initiativeId: string) {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("initiative_responses")
    .select("id")
    .eq("initiative_id", initiativeId)
    .eq("membership_id", ctx.activeMembership!.id)
    .eq("response_type", "support")
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("initiative_responses")
      .delete()
      .eq("id", existing.id);
    if (error) return { error: error.message, supported: true };
    revalidatePath(ROUTES.initiatives.detail(initiativeId));
    return { success: true, supported: false };
  }

  const { error } = await supabase.from("initiative_responses").insert({
    initiative_id: initiativeId,
    membership_id: ctx.activeMembership!.id,
    response_type: "support",
  });

  if (error) return { error: error.message, supported: false };
  revalidatePath(ROUTES.initiatives.detail(initiativeId));
  return { success: true, supported: true };
}

export async function submitInitiativeResponse(
  initiativeId: string,
  responseType: "support" | "volunteer",
) {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();

  const { error } = await supabase.from("initiative_responses").upsert(
    {
      initiative_id: initiativeId,
      membership_id: ctx.activeMembership!.id,
      response_type: responseType,
    },
    { onConflict: "initiative_id,membership_id,response_type" },
  );

  if (error) return { error: error.message };
  revalidatePath(ROUTES.initiatives.detail(initiativeId));
  return { success: true };
}

export async function submitDeleteInitiative(formData: FormData): Promise<void> {
  const id = parseFormId(formData);
  if (!id) return;
  await deleteInitiative(id);
}

export async function submitArchiveInitiative(formData: FormData): Promise<void> {
  const id = parseFormId(formData);
  if (!id) return;
  await updateInitiativeStatus(id, INITIATIVE_STATUS.archived);
}

export async function deleteInitiative(
  id: string,
): Promise<{ success: true } | { error: string }> {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();

  const auth = await assertAuthorMembership(
    supabase,
    "initiatives",
    id,
    ctx.activeMembership!.id,
  );
  if (auth.error) return { error: auth.error };

  const { error } = await supabase.from("initiatives").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(ROUTES.initiatives.list);
  return { success: true };
}
