import type { SupabaseClient } from "@supabase/supabase-js";

type AuthorTable = "events" | "initiatives" | "announcements";

export async function assertAuthorMembership(
  supabase: SupabaseClient,
  table: AuthorTable,
  id: string,
  membershipId: string,
): Promise<{ error?: string }> {
  const { data: row } = await supabase
    .from(table)
    .select("author_membership_id")
    .eq("id", id)
    .single();

  if (row?.author_membership_id !== membershipId) {
    return { error: "Non autorisé" };
  }

  return {};
}

/** Author or municipality staff managing an official commune event. */
export async function assertCanManageEvent(
  supabase: SupabaseClient,
  id: string,
  membershipId: string,
  communeId: string,
  isMunicipalityStaff: boolean,
): Promise<{ error?: string }> {
  const { data: row } = await supabase
    .from("events")
    .select("author_membership_id, is_official, commune_id")
    .eq("id", id)
    .single();

  if (!row) return { error: "Événement introuvable" };
  if (row.commune_id !== communeId) return { error: "Non autorisé" };
  if (row.author_membership_id === membershipId) return {};
  if (row.is_official && isMunicipalityStaff) return {};
  return { error: "Non autorisé" };
}
