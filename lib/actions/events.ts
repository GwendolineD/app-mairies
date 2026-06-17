"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAuthorMembership } from "@/lib/auth/ownership";
import { requireActiveMembership } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { EVENT_STATUS } from "@/lib/constants/statuses";
import { createClient } from "@/lib/supabase/server";
import { parseFormId } from "@/lib/utils/form-data";
import { eventSchema } from "@/lib/validations/schemas";
import { fanoutNewContentNotification } from "@/lib/services/notification-fanout";

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
  revalidatePath(ROUTES.profil);

  void supabase.rpc("increment_membership_counter", {
    p_membership_id: membership.id,
    p_column_name: "total_events_published",
  }).then(({ error: rpcErr }) => {
    if (rpcErr) console.error("[createEvent] counter increment failed", rpcErr.message);
  });

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
