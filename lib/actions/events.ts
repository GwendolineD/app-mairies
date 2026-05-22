"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveMembership } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { eventSchema } from "@/lib/validations/schemas";

export async function createEvent(formData: FormData): Promise<void> {
  const ctx = await requireActiveMembership();
  const raw = {
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
    startsAt: formData.get("startsAt") as string,
    endsAt: formData.get("endsAt") as string,
  };
  const parsed = eventSchema.safeParse(raw);
  if (!parsed.success) return;

  const supabase = await createClient();
  const { error } = await supabase.from("events").insert({
    commune_id: ctx.activeMembership!.commune_id,
    author_membership_id: ctx.activeMembership!.id,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    starts_at: new Date(parsed.data.startsAt).toISOString(),
    ends_at: new Date(parsed.data.endsAt).toISOString(),
    status: "active",
  });

  if (error) return;
  revalidatePath("/evenements");
  redirect("/evenements");
}

export async function updateEventStatus(id: string, status: "active" | "archived") {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("events")
    .select("author_membership_id")
    .eq("id", id)
    .single();

  if (row?.author_membership_id !== ctx.activeMembership!.id) {
    return { error: "Non autorisé" };
  }

  const { error } = await supabase.from("events").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/evenements");
  revalidatePath(`/evenements/${id}`);
  return { success: true };
}

export async function deleteEvent(id: string) {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("events")
    .select("author_membership_id")
    .eq("id", id)
    .single();

  if (row?.author_membership_id !== ctx.activeMembership!.id) {
    return { error: "Non autorisé" };
  }

  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/evenements");
  return { success: true };
}

export async function submitDeleteEvent(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;
  await deleteEvent(id);
}

export async function submitArchiveEvent(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;
  await updateEventStatus(id, "archived");
}
