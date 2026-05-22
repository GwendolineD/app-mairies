"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveMembership } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { initiativeSchema } from "@/lib/validations/schemas";

export async function createInitiative(formData: FormData): Promise<void> {
  const ctx = await requireActiveMembership();
  const raw = {
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
    dateMode: formData.get("dateMode") as string,
    singleStartsAt: (formData.get("singleStartsAt") as string) || undefined,
    singleEndsAt: (formData.get("singleEndsAt") as string) || undefined,
  };
  const parsed = initiativeSchema.safeParse(raw);
  if (!parsed.success) return;

  const supabase = await createClient();

  let singleStartsAt: string | null = null;
  let singleEndsAt: string | null = null;

  if (parsed.data.dateMode === "once") {
    singleStartsAt = parsed.data.singleStartsAt
      ? new Date(parsed.data.singleStartsAt).toISOString()
      : null;
    singleEndsAt = parsed.data.singleEndsAt
      ? new Date(parsed.data.singleEndsAt).toISOString()
      : null;
  }

  const { error } = await supabase.from("initiatives").insert({
    commune_id: ctx.activeMembership!.commune_id,
    author_membership_id: ctx.activeMembership!.id,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    date_mode: parsed.data.dateMode,
    single_starts_at: singleStartsAt,
    single_ends_at: singleEndsAt,
    status: "active",
  });

  if (error) return;
  revalidatePath("/initiatives");
  redirect("/initiatives");
}

export async function updateInitiativeStatus(id: string, status: "active" | "archived") {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("initiatives")
    .select("author_membership_id")
    .eq("id", id)
    .single();

  if (row?.author_membership_id !== ctx.activeMembership!.id) {
    return { error: "Non autorisé" };
  }

  const { error } = await supabase.from("initiatives").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/initiatives");
  revalidatePath(`/initiatives/${id}`);
  return { success: true };
}

export async function submitDeleteInitiative(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;
  await deleteInitiative(id);
}

export async function submitArchiveInitiative(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;
  await updateInitiativeStatus(id, "archived");
}

export async function deleteInitiative(id: string) {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("initiatives")
    .select("author_membership_id")
    .eq("id", id)
    .single();

  if (row?.author_membership_id !== ctx.activeMembership!.id) {
    return { error: "Non autorisé" };
  }

  const { error } = await supabase.from("initiatives").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/initiatives");
  return { success: true };
}
