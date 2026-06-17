"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAuthorMembership } from "@/lib/auth/ownership";
import { requireActiveMembership } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { EVENT_STATUS } from "@/lib/constants/statuses";
import { createClient } from "@/lib/supabase/server";
import { parseFormId } from "@/lib/utils/form-data";
import { eventSchema, eventModalSchema } from "@/lib/validations/schemas";
import { fanoutNewContentNotification } from "@/lib/services/notification-fanout";
import type { EventEditData, AgendaEventRecord } from "@/lib/types";

export async function createEvent(formData: FormData): Promise<void> {
  const ctx = await requireActiveMembership();
  const raw = {
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
    startsAt: formData.get("startsAt") as string,
    endsAt: formData.get("endsAt") as string,
    addressLabel: (formData.get("addressLabel") as string) || undefined,
  };
  const parsed = eventSchema.safeParse(raw);
  if (!parsed.success) return;

  const membership = ctx.activeMembership!;
  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("events")
    .insert({
      commune_id: membership.commune_id,
      author_membership_id: membership.id,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      starts_at: new Date(parsed.data.startsAt).toISOString(),
      ends_at: new Date(parsed.data.endsAt).toISOString(),
      address_label:
        parsed.data.addressLabel ??
        (membership as { address_label?: string | null }).address_label ??
        null,
      address_lat: membership.address_lat,
      address_lng: membership.address_lng,
      status: EVENT_STATUS.active,
    })
    .select("id")
    .single();

  if (error || !created) return;
  revalidatePath(ROUTES.evenements.list);

  void fanoutNewContentNotification({
    contextType: "event",
    contextId: created.id,
    communeId: membership.commune_id,
    authorUserId: ctx.userId,
    title: parsed.data.title,
    authorDisplayName: ctx.profile.display_name,
  });

  redirect(ROUTES.evenements.list);
}

export async function updateEventStatus(
  id: string,
  status: (typeof EVENT_STATUS)[keyof typeof EVENT_STATUS],
) {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();

  const auth = await assertAuthorMembership(
    supabase,
    "events",
    id,
    ctx.activeMembership!.id,
  );
  if (auth.error) return auth;

  const { error } = await supabase.from("events").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(ROUTES.evenements.list);
  revalidatePath(ROUTES.evenements.detail(id));
  return { success: true };
}

export async function deleteEvent(id: string) {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();

  const auth = await assertAuthorMembership(
    supabase,
    "events",
    id,
    ctx.activeMembership!.id,
  );
  if (auth.error) return auth;

  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(ROUTES.evenements.list);
  return { success: true };
}

export async function submitDeleteEvent(formData: FormData): Promise<void> {
  const id = parseFormId(formData);
  if (!id) return;
  await deleteEvent(id);
}

export async function submitArchiveEvent(formData: FormData): Promise<void> {
  const id = parseFormId(formData);
  if (!id) return;
  await updateEventStatus(id, EVENT_STATUS.archived);
}

export type CreateEventFromModalInput = {
  categorySlug: string;
  title: string;
  description?: string;
  photoUrl?: string;
  startsAt: string;
  endsAt: string;
  volunteersNeeded?: number | null;
  addressStreet?: string;
  addressCity?: string;
  addressCitycode?: string;
  addressPostcode?: string;
  addressLat?: number;
  addressLng?: number;
  sourceInitiativeId?: string;
};

export async function createEventFromModal(
  input: CreateEventFromModalInput,
): Promise<{ success: true; id: string } | { error: string }> {
  const ctx = await requireActiveMembership();
  const parsed = eventModalSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return { error: firstError?.message ?? "Données invalides" };
  }

  const membership = ctx.activeMembership!;
  const supabase = await createClient();

  const addressLabel = [parsed.data.addressStreet, parsed.data.addressCity]
    .filter(Boolean)
    .join(", ") || null;

  const { data: created, error } = await supabase
    .from("events")
    .insert({
      commune_id: membership.commune_id,
      author_membership_id: membership.id,
      category_slug: parsed.data.categorySlug,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      photo_url: parsed.data.photoUrl || null,
      starts_at: new Date(parsed.data.startsAt).toISOString(),
      ends_at: new Date(parsed.data.endsAt).toISOString(),
      volunteers_needed: parsed.data.volunteersNeeded ?? null,
      address_label: addressLabel,
      address_lat: parsed.data.addressLat ?? null,
      address_lng: parsed.data.addressLng ?? null,
      source_initiative_id: parsed.data.sourceInitiativeId ?? null,
      status: EVENT_STATUS.active,
    })
    .select("id")
    .single();

  if (error || !created) {
    return { error: error?.message ?? "Erreur lors de la création" };
  }

  revalidatePath(ROUTES.evenements.list);

  void fanoutNewContentNotification({
    contextType: "event",
    contextId: created.id,
    communeId: membership.commune_id,
    authorUserId: ctx.userId,
    title: parsed.data.title,
    authorDisplayName: ctx.profile.display_name,
  });

  return { success: true, id: created.id };
}

export async function updateEvent(
  id: string,
  input: CreateEventFromModalInput,
): Promise<{ success: true } | { error: string }> {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();

  const auth = await assertAuthorMembership(
    supabase,
    "events",
    id,
    ctx.activeMembership!.id,
  );
  if (auth.error) return auth;

  const parsed = eventModalSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return { error: firstError?.message ?? "Données invalides" };
  }

  const addressLabel = [parsed.data.addressStreet, parsed.data.addressCity]
    .filter(Boolean)
    .join(", ") || null;

  const { error } = await supabase
    .from("events")
    .update({
      category_slug: parsed.data.categorySlug,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      photo_url: parsed.data.photoUrl || null,
      starts_at: new Date(parsed.data.startsAt).toISOString(),
      ends_at: new Date(parsed.data.endsAt).toISOString(),
      volunteers_needed: parsed.data.volunteersNeeded ?? null,
      address_label: addressLabel,
      address_lat: parsed.data.addressLat ?? null,
      address_lng: parsed.data.addressLng ?? null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(ROUTES.evenements.list);
  revalidatePath(ROUTES.evenements.detail(id));
  return { success: true };
}

export async function getEventForEdit(
  id: string,
): Promise<{ data: EventEditData } | { error: string }> {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .eq("commune_id", ctx.activeMembership!.commune_id)
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Événement introuvable" };
  }

  const event = data as AgendaEventRecord;

  const labelParts = (event.address_label ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  const editData: EventEditData = {
    categorySlug: event.category_slug ?? "solidarite",
    title: event.title,
    description: event.description ?? "",
    photoUrl: event.photo_url ?? "",
    startsAt: event.starts_at,
    endsAt: event.ends_at,
    volunteersNeeded: event.volunteers_needed,
    addressStreet: labelParts[0] ?? "",
    addressCity: labelParts.slice(1).join(", ") ?? "",
    addressCitycode: "",
    addressPostcode: "",
    addressLat: event.address_lat ?? 0,
    addressLng: event.address_lng ?? 0,
    sourceInitiativeId: event.source_initiative_id ?? undefined,
  };

  return { data: editData };
}

export async function duplicateEvent(
  id: string,
): Promise<{ success: true; id: string } | { error: string }> {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();

  const { data: original, error: fetchError } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .eq("commune_id", ctx.activeMembership!.commune_id)
    .single();

  if (fetchError || !original) {
    return { error: fetchError?.message ?? "Événement introuvable" };
  }

  const event = original as AgendaEventRecord;
  const membership = ctx.activeMembership!;

  const { data: created, error } = await supabase
    .from("events")
    .insert({
      commune_id: membership.commune_id,
      author_membership_id: membership.id,
      category_slug: event.category_slug,
      title: `${event.title} (copie)`,
      description: event.description,
      photo_url: event.photo_url,
      starts_at: event.starts_at,
      ends_at: event.ends_at,
      volunteers_needed: event.volunteers_needed,
      address_label: event.address_label,
      address_lat: event.address_lat,
      address_lng: event.address_lng,
      source_initiative_id: event.source_initiative_id,
      status: EVENT_STATUS.active,
    })
    .select("id")
    .single();

  if (error || !created) {
    return { error: error?.message ?? "Erreur lors de la duplication" };
  }

  revalidatePath(ROUTES.evenements.list);
  return { success: true, id: created.id };
}
