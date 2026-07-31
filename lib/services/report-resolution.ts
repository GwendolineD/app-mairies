import { revalidatePath } from "next/cache";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";

export async function resolvePendingReportsForContent(
  contextType: "announcement" | "initiative" | "event" | "user",
  contextId: string,
  communeId: string,
  resolution: "content_suspended" | "user_suspended" | "dismissed",
  reviewedByUserId: string,
): Promise<void> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("reports")
    .update({
      status: "reviewed",
      reviewed_at: now,
      reviewed_by_user_id: reviewedByUserId,
      resolution,
    })
    .eq("context_type", contextType)
    .eq("context_id", contextId)
    .eq("commune_id", communeId)
    .eq("status", "pending");

  if (error) {
    console.error(
      "[reports] Failed to resolve pending reports for content:",
      error.message,
      error.code,
    );
    return;
  }

  revalidatePath(ROUTES.mairie.signalements);
  revalidatePath(ROUTES.backoffice.signalements);
  revalidatePath("/backoffice", "layout");
}

export async function resolvePendingReportsForUser(
  membershipId: string,
  userId: string,
  communeId: string,
  reviewedByUserId: string,
): Promise<void> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const [{ data: annIds }, { data: iniIds }, { data: evtIds }] =
    await Promise.all([
      supabase
        .from("announcements")
        .select("id")
        .eq("author_membership_id", membershipId),
      supabase
        .from("initiatives")
        .select("id")
        .eq("author_membership_id", membershipId),
      supabase
        .from("events")
        .select("id")
        .eq("author_membership_id", membershipId),
    ]);

  const authorContentIds = [
    ...(annIds ?? []),
    ...(iniIds ?? []),
    ...(evtIds ?? []),
  ].map((row) => row.id);

  const targetContextIds = [userId, ...authorContentIds];

  const { error } = await supabase
    .from("reports")
    .update({
      status: "reviewed",
      reviewed_at: now,
      reviewed_by_user_id: reviewedByUserId,
      resolution: "user_suspended",
    })
    .eq("commune_id", communeId)
    .eq("status", "pending")
    .in("context_id", targetContextIds);

  if (error) {
    console.error(
      "[reports] Failed to cascade-resolve reports for suspended user:",
      error.message,
      error.code,
    );
    return;
  }

  revalidatePath(ROUTES.mairie.signalements);
  revalidatePath(ROUTES.backoffice.signalements);
  revalidatePath("/backoffice", "layout");
}

export async function markReportsRestoredForContent(
  contextType: "announcement" | "initiative" | "event",
  contextId: string,
  restoredAt: string,
  restoredByUserId: string,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("reports")
    .update({
      restored_at: restoredAt,
      restored_by_user_id: restoredByUserId,
    })
    .eq("context_type", contextType)
    .eq("context_id", contextId)
    .eq("resolution", "content_suspended");

  if (error) {
    console.error(
      "[reports] Failed to mark content reports as restored:",
      error.message,
      error.code,
    );
  }
}

export async function markReportsRestoredForUser(
  membershipId: string,
  userId: string,
  communeId: string,
  restoredAt: string,
  restoredByUserId: string,
): Promise<void> {
  const supabase = await createClient();

  const [{ data: annIds }, { data: iniIds }, { data: evtIds }] =
    await Promise.all([
      supabase
        .from("announcements")
        .select("id")
        .eq("author_membership_id", membershipId),
      supabase
        .from("initiatives")
        .select("id")
        .eq("author_membership_id", membershipId),
      supabase
        .from("events")
        .select("id")
        .eq("author_membership_id", membershipId),
    ]);

  const authorContentIds = [
    ...(annIds ?? []),
    ...(iniIds ?? []),
    ...(evtIds ?? []),
  ].map((row) => row.id);

  const targetContextIds = [userId, ...authorContentIds];

  const { error } = await supabase
    .from("reports")
    .update({
      restored_at: restoredAt,
      restored_by_user_id: restoredByUserId,
    })
    .eq("commune_id", communeId)
    .eq("resolution", "user_suspended")
    .in("context_id", targetContextIds);

  if (error) {
    console.error(
      "[reports] Failed to mark user reports as restored:",
      error.message,
      error.code,
    );
  }
}
