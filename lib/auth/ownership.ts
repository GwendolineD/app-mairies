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
