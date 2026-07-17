import type { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Re-points a user's `active_commune_id` away from a commune they were just
 * suspended from. Falls back to another active membership, or `null` when none
 * remains (the user then lands on `/suspendu`). Idempotent: no-op when the
 * suspended commune is not the currently active one.
 */
export async function reassignActiveCommuneAfterSuspension(
  supabase: ServerClient,
  userId: string,
  suspendedCommuneId: string,
): Promise<void> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("active_commune_id")
    .eq("user_id", userId)
    .single();

  if (profile?.active_commune_id !== suspendedCommuneId) return;

  const { data: fallback } = await supabase
    .from("memberships")
    .select("commune_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .neq("commune_id", suspendedCommuneId)
    .limit(1)
    .maybeSingle();

  await supabase
    .from("profiles")
    .update({ active_commune_id: fallback?.commune_id ?? null })
    .eq("user_id", userId);
}
