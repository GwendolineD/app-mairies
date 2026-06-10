import type { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Resolves a readable author name from an author_membership_id.
 * memberships.user_id and profiles.user_id both reference auth.users with no
 * direct FK, so this walks membership → profile in two bounded lookups.
 */
export async function getAuthorName(
  supabase: ServerClient,
  authorMembershipId: string,
): Promise<string> {
  const { data: membership } = await supabase
    .from("memberships")
    .select("user_id")
    .eq("id", authorMembershipId)
    .single();

  if (!membership) return "Habitant·e";

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, first_name, last_name")
    .eq("user_id", membership.user_id)
    .single();

  return (
    profile?.display_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    "Habitant·e"
  );
}
