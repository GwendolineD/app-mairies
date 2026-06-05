"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAuthorMembership } from "@/lib/auth/ownership";
import { requireActiveMembership } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { INITIATIVE_STATUS } from "@/lib/constants/statuses";
import { createClient } from "@/lib/supabase/server";
import { parseFormId } from "@/lib/utils/form-data";
import { initiativeSchema } from "@/lib/validations/schemas";

export async function createInitiative(formData: FormData): Promise<void> {
  const ctx = await requireActiveMembership();
  const raw = {
    categorySlug: formData.get("categorySlug") as string,
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
    dateMode: formData.get("dateMode") as string,
    singleStartsAt: (formData.get("singleStartsAt") as string) || undefined,
    singleEndsAt: (formData.get("singleEndsAt") as string) || undefined,
    locationLabel: (formData.get("locationLabel") as string) || undefined,
    photoUrl: (formData.get("photoUrl") as string) || "",
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
    category_slug: parsed.data.categorySlug,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    date_mode: parsed.data.dateMode,
    single_starts_at: singleStartsAt,
    single_ends_at: singleEndsAt,
    location_label: parsed.data.locationLabel ?? null,
    photo_url: parsed.data.photoUrl || null,
    status: INITIATIVE_STATUS.active,
  });

  if (error) return;
  revalidatePath(ROUTES.initiatives.list);
  redirect(ROUTES.initiatives.list);
}

/**
 * Toggle the current member's participation (volunteer) on an initiative.
 * Idempotent: inserts the response if absent, removes it otherwise.
 */
export async function toggleInitiativeParticipation(
  formData: FormData,
): Promise<void> {
  const initiativeId = parseFormId(formData);
  if (!initiativeId) return;

  const ctx = await requireActiveMembership();
  const supabase = await createClient();
  const membershipId = ctx.activeMembership!.id;

  // Ensure the initiative is visible within the active commune (defense in depth).
  const { data: initiative } = await supabase
    .from("initiatives")
    .select("id")
    .eq("id", initiativeId)
    .eq("commune_id", ctx.activeMembership!.commune_id)
    .single();
  if (!initiative) return;

  const { data: existing } = await supabase
    .from("initiative_responses")
    .select("id")
    .eq("initiative_id", initiativeId)
    .eq("membership_id", membershipId)
    .eq("response_type", "volunteer")
    .maybeSingle();

  if (existing) {
    await supabase.from("initiative_responses").delete().eq("id", existing.id);
  } else {
    await supabase.from("initiative_responses").insert({
      initiative_id: initiativeId,
      membership_id: membershipId,
      response_type: "volunteer",
    });
  }

  revalidatePath(ROUTES.initiatives.detail(initiativeId));
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
  if (auth.error) return auth;

  const { error } = await supabase
    .from("initiatives")
    .update({ status })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(ROUTES.initiatives.list);
  revalidatePath(ROUTES.initiatives.detail(id));
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

export async function deleteInitiative(id: string) {
  const ctx = await requireActiveMembership();
  const supabase = await createClient();

  const auth = await assertAuthorMembership(
    supabase,
    "initiatives",
    id,
    ctx.activeMembership!.id,
  );
  if (auth.error) return auth;

  const { error } = await supabase.from("initiatives").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(ROUTES.initiatives.list);
  return { success: true };
}
