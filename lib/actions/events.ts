"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { logAudit } from "@/lib/audit/log";
import { assertAuthorMembership, assertCanManageEvent } from "@/lib/auth/ownership";
import { requireActiveMembership } from "@/lib/auth/session";
import { COMMUNE_STAFF_ROLES } from "@/lib/constants/roles";
import { ROUTES } from "@/lib/constants/routes";
import { EVENT_STATUS } from "@/lib/constants/statuses";
import { createClient } from "@/lib/supabase/server";
import { parseFormId } from "@/lib/utils/form-data";
import { resolveAddressCoordinates } from "@/lib/ban/client";
import { buildAddressLabel, parseAddressLabelParts } from "@/lib/utils/format-address";
import { eventSchema, eventModalSchema } from "@/lib/validations/schemas";
import { fanoutNewContentNotification } from "@/lib/services/notification-fanout";
import { notifyAuthorEngagement } from "@/lib/services/author-engagement-notifications";
import { incrementMembershipPublishCounter } from "@/lib/services/membership-publish-counters";
import { cancelPendingEmails } from "@/lib/cron/cancel-pending-emails";
import {
  getInitiativeSupporterUserIds,
  notifyInitiativeSupporters,
} from "@/lib/services/initiative-to-event-notification";
import type { OutcomeReason } from "@/lib/constants/content-outcomes";
import { isOutcomeReason } from "@/lib/constants/content-outcomes";
import type { EventEditData, AgendaEventRecord } from "@/lib/types";
import {
  listEventVolunteers,
  listEventParticipants,
  EVENT_MEMBER_LIST_PAGE_SIZE,
} from "@/lib/queries/events";

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
      starts_at: parsed.data.startsAt,
      ends_at: parsed.data.endsAt,
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
  revalidatePath(ROUTES.profil);

  incrementMembershipPublishCounter(
    supabase,
    membership.id,
    "total_events_published",
    { logContext: "createEvent" },
  );

  after(() =>
    fanoutNewContentNotification({
      contextType: "event",
      contextId: created.id,
      communeId: membership.commune_id,
      authorUserId: ctx.userId,
      title: parsed.data.title,
      authorDisplayName: ctx.profile.display_name,
    }),
  );

  void logAudit({
    action: "content.create_event",
    category: "content",
    userId: ctx.userId,
    targetType: "event",
    targetId: created.id,
    communeId: membership.commune_id,
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
  if (auth.error) return { error: auth.error };

  const { error } = await supabase.from("events").update({ status }).eq("id", id);
  if (error) return { error: error.message };

  if (status === EVENT_STATUS.archived) {
    void cancelPendingEmails("event", id);
  }

  revalidatePath(ROUTES.evenements.list);
  revalidatePath(ROUTES.evenements.detail(id));
  return { success: true };
}

export async function deleteEvent(
  id: string,
  outcome: OutcomeReason,
): Promise<{ success: true } | { error: string }> {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();

  const auth = await assertCanMutateEvent(
    supabase,
    id,
    ctx.activeMembership!,
  );
  if (auth.error) return { error: auth.error };

  const { data: evt, error: fetchError } = await supabase
    .from("events")
    .select("category_slug, commune_id")
    .eq("id", id)
    .single();

  if (fetchError) return { error: fetchError.message };

  const { error: outcomeError } = await supabase.from("content_outcomes").insert({
    commune_id: evt.commune_id,
    membership_id: ctx.activeMembership!.id,
    content_kind: "event",
    content_type: null,
    category_slug: evt.category_slug ?? "autre",
    outcome,
  });

  if (outcomeError) return { error: outcomeError.message };

  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return { error: error.message };

  void cancelPendingEmails("event", id);

  void logAudit({
    action: "content.delete_event",
    category: "content",
    userId: ctx.userId,
    targetType: "event",
    targetId: id,
    communeId: ctx.activeMembership!.commune_id,
    metadata: { outcome },
  });

  revalidatePath(ROUTES.evenements.list);
  revalidatePath(ROUTES.mairie.evenements);
  revalidatePath(ROUTES.mairie.evenementDetail(id));
  revalidatePath(ROUTES.accueil);
  revalidatePath(ROUTES.mairie.dashboard);
  return { success: true };
}

export async function submitDeleteEvent(formData: FormData): Promise<void> {
  const id = parseFormId(formData);
  const outcomeRaw = formData.get("outcome");
  if (!id || typeof outcomeRaw !== "string" || !isOutcomeReason(outcomeRaw)) return;
  await deleteEvent(id, outcomeRaw);
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
  sourceInitiativeTitle?: string;
  isOfficial?: boolean;
};

function isMunicipalityStaffMembership(
  membership: { role: string } | null | undefined,
): boolean {
  return (
    !!membership &&
    (COMMUNE_STAFF_ROLES as readonly string[]).includes(membership.role)
  );
}

async function assertCanMutateEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string,
  membership: { id: string; commune_id: string; role: string },
) {
  return assertCanManageEvent(
    supabase,
    id,
    membership.id,
    membership.commune_id,
    isMunicipalityStaffMembership(membership),
  );
}

export async function createEventFromModal(
  input: CreateEventFromModalInput,
): Promise<{ success: true; id: string } | { error: string }> {
  const ctx = await requireActiveMembership();
  const parsed = eventModalSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { error: firstError?.message ?? "Données invalides" };
  }

  const membership = ctx.activeMembership!;
  const supabase = await createClient();

  const addressLabel = buildAddressLabel(
    parsed.data.addressStreet,
    parsed.data.addressPostcode,
    parsed.data.addressCity,
  );

  let addressLat = parsed.data.addressLat ?? null;
  let addressLng = parsed.data.addressLng ?? null;

  if (addressLabel && (addressLat == null || addressLng == null)) {
    const citycode = parsed.data.addressCitycode?.trim();
    const street = parsed.data.addressStreet?.trim();
    if (street && citycode) {
      const resolved = await resolveAddressCoordinates(street, citycode);
      if (resolved) {
        addressLat = resolved.lat;
        addressLng = resolved.lng;
      }
    }
  }

  const { data: created, error } = await supabase
    .from("events")
    .insert({
      commune_id: membership.commune_id,
      author_membership_id: membership.id,
      category_slug: parsed.data.categorySlug,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      photo_url: parsed.data.photoUrl || null,
      starts_at: parsed.data.startsAt,
      ends_at: parsed.data.endsAt,
      volunteers_needed: parsed.data.volunteersNeeded ?? null,
      address_label: addressLabel,
      address_lat: addressLat,
      address_lng: addressLng,
      source_initiative_id: parsed.data.sourceInitiativeId ?? null,
      is_official: parsed.data.isOfficial ?? false,
      status: EVENT_STATUS.active,
    })
    .select("id")
    .single();

  if (error || !created) {
    return { error: error?.message ?? "Erreur lors de la création" };
  }

  revalidatePath(ROUTES.evenements.list);
  revalidatePath(ROUTES.mairie.evenements);
  revalidatePath(ROUTES.mairie.evenementDetail(created.id));
  revalidatePath(ROUTES.profil);

  incrementMembershipPublishCounter(
    supabase,
    membership.id,
    "total_events_published",
    {
      skip: parsed.data.isOfficial === true,
      logContext: "createEventFromModal",
    },
  );

  // Collect supporter IDs synchronously (1 fast query) for deduplication
  const supporterUserIds = parsed.data.sourceInitiativeId
    ? await getInitiativeSupporterUserIds(parsed.data.sourceInitiativeId, ctx.userId)
    : [];

  after(() =>
    fanoutNewContentNotification({
      contextType: "event",
      contextId: created.id,
      communeId: membership.commune_id,
      authorUserId: ctx.userId,
      title: parsed.data.title,
      authorDisplayName: ctx.profile.display_name,
      excludeUserIds: supporterUserIds,
    }),
  );

  if (supporterUserIds.length > 0) {
    void notifyInitiativeSupporters({
      supporterUserIds,
      initiativeTitle: parsed.data.sourceInitiativeTitle ?? parsed.data.title,
      eventId: created.id,
      eventTitle: parsed.data.title,
      eventStartsAt: parsed.data.startsAt,
      communeId: membership.commune_id,
      authorDisplayName: ctx.profile.display_name,
    });
  }

  void logAudit({
    action: "content.create_event",
    category: "content",
    userId: ctx.userId,
    targetType: "event",
    targetId: created.id,
    communeId: membership.commune_id,
  });

  return { success: true, id: created.id };
}

export async function updateEvent(
  id: string,
  input: CreateEventFromModalInput,
): Promise<{ success: true } | { error: string }> {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();

  const auth = await assertCanMutateEvent(
    supabase,
    id,
    ctx.activeMembership!,
  );
  if (auth.error) return { error: auth.error };

  const parsed = eventModalSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { error: firstError?.message ?? "Données invalides" };
  }

  const addressLabel = buildAddressLabel(
    parsed.data.addressStreet,
    parsed.data.addressPostcode,
    parsed.data.addressCity,
  );

  let addressLat = parsed.data.addressLat ?? null;
  let addressLng = parsed.data.addressLng ?? null;

  if (addressLabel && (addressLat == null || addressLng == null)) {
    const citycode = parsed.data.addressCitycode?.trim();
    const street = parsed.data.addressStreet?.trim();
    if (street && citycode) {
      const resolved = await resolveAddressCoordinates(street, citycode);
      if (resolved) {
        addressLat = resolved.lat;
        addressLng = resolved.lng;
      }
    }
  }

  const { error } = await supabase
    .from("events")
    .update({
      category_slug: parsed.data.categorySlug,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      photo_url: parsed.data.photoUrl || null,
      starts_at: parsed.data.startsAt,
      ends_at: parsed.data.endsAt,
      volunteers_needed: parsed.data.volunteersNeeded ?? null,
      address_label: addressLabel,
      address_lat: addressLat,
      address_lng: addressLng,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(ROUTES.evenements.list);
  revalidatePath(ROUTES.evenements.detail(id));
  revalidatePath(ROUTES.mairie.evenements);
  revalidatePath(ROUTES.mairie.evenementDetail(id));

  void logAudit({
    action: "content.update_event",
    category: "content",
    userId: ctx.userId,
    targetType: "event",
    targetId: id,
    communeId: ctx.activeMembership!.commune_id,
  });

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

  const parsedAddress = parseAddressLabelParts(event.address_label ?? "");

  const editData: EventEditData = {
    categorySlug: event.category_slug ?? "solidarite",
    title: event.title,
    description: event.description ?? "",
    photoUrl: event.photo_url ?? "",
    startsAt: event.starts_at,
    endsAt: event.ends_at,
    volunteersNeeded: event.volunteers_needed,
    addressStreet: parsedAddress.street ?? "",
    addressCity: parsedAddress.city ?? "",
    addressCitycode: "",
    addressPostcode: parsedAddress.postcode ?? "",
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

/** Toggle volunteer registration for an event. */
export async function toggleEventVolunteer(eventId: string) {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();
  const membership = ctx.activeMembership!;

  const { data: event, error: fetchError } = await supabase
    .from("events")
    .select("id, title, author_membership_id")
    .eq("id", eventId)
    .eq("commune_id", membership.commune_id)
    .single();

  if (fetchError || !event) {
    return { error: "Événement introuvable.", volunteering: false };
  }

  const { data: existing } = await supabase
    .from("event_volunteers")
    .select("id")
    .eq("event_id", eventId)
    .eq("membership_id", membership.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("event_volunteers")
      .delete()
      .eq("id", existing.id);
    if (error) return { error: error.message, volunteering: true };
    revalidatePath(ROUTES.evenements.detail(eventId));
    return { success: true as const, volunteering: false };
  }

  const { error } = await supabase.from("event_volunteers").insert({
    event_id: eventId,
    membership_id: membership.id,
  });

  if (error) return { error: error.message, volunteering: false };

  const actorName = ctx.profile.display_name ?? "Un·e voisin·e";
  void notifyAuthorEngagement({
    authorMembershipId: event.author_membership_id,
    actorUserId: ctx.userId,
    actorName,
    prefKey: "notify_event_volunteer",
    title: `Nouveau·elle bénévole — ${actorName}`,
    body: event.title,
    url: ROUTES.evenements.detail(eventId),
    tag: `event-volunteer:${eventId}:${membership.id}`,
    payloadJson: {
      kind: "engagement",
      engagement_type: "event_volunteer",
      context_type: "event",
      context_id: eventId,
      actor_user_id: ctx.userId,
    },
  });

  revalidatePath(ROUTES.evenements.detail(eventId));
  return { success: true as const, volunteering: true };
}

/** Toggle participation for an event. */
export async function toggleEventParticipation(eventId: string) {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();
  const membership = ctx.activeMembership!;

  const { data: event, error: fetchError } = await supabase
    .from("events")
    .select("id, title, author_membership_id")
    .eq("id", eventId)
    .eq("commune_id", membership.commune_id)
    .single();

  if (fetchError || !event) {
    return { error: "Événement introuvable.", participating: false };
  }

  const { data: existing } = await supabase
    .from("event_participants")
    .select("id")
    .eq("event_id", eventId)
    .eq("membership_id", membership.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("event_participants")
      .delete()
      .eq("id", existing.id);
    if (error) return { error: error.message, participating: true };
    revalidatePath(ROUTES.evenements.detail(eventId));
    return { success: true as const, participating: false };
  }

  const { error } = await supabase.from("event_participants").insert({
    event_id: eventId,
    membership_id: membership.id,
  });

  if (error) return { error: error.message, participating: false };

  const actorName = ctx.profile.display_name ?? "Un·e voisin·e";
  void notifyAuthorEngagement({
    authorMembershipId: event.author_membership_id,
    actorUserId: ctx.userId,
    actorName,
    prefKey: "notify_event_participation",
    title: `Nouvelle participation — ${actorName}`,
    body: event.title,
    url: ROUTES.evenements.detail(eventId),
    tag: `event-participation:${eventId}:${membership.id}`,
    payloadJson: {
      kind: "engagement",
      engagement_type: "event_participation",
      context_type: "event",
      context_id: eventId,
      actor_user_id: ctx.userId,
    },
  });

  revalidatePath(ROUTES.evenements.detail(eventId));
  return { success: true as const, participating: true };
}

/** Load more event volunteers in the detail modal. */
export async function fetchMoreEventVolunteers(
  eventId: string,
  offset: number,
) {
  await requireActiveMembership();
  const supabase = await createClient();

  return listEventVolunteers(supabase, eventId, {
    limit: EVENT_MEMBER_LIST_PAGE_SIZE,
    offset,
  });
}

/** Load more event participants in the detail modal. */
export async function fetchMoreEventParticipants(
  eventId: string,
  offset: number,
) {
  await requireActiveMembership();
  const supabase = await createClient();

  return listEventParticipants(supabase, eventId, {
    limit: EVENT_MEMBER_LIST_PAGE_SIZE,
    offset,
  });
}
