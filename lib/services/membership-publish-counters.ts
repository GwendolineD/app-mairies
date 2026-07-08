import type { SupabaseClient } from "@supabase/supabase-js";

export type MembershipPublishCounter =
  | "total_announcements_published"
  | "total_initiatives_published"
  | "total_events_published";

type IncrementOptions = {
  skip?: boolean;
  logContext?: string;
};

/**
 * Best-effort increment of a denormalized publish counter on memberships.
 * Skipped when `options.skip` is true (e.g. official municipality events).
 */
export function incrementMembershipPublishCounter(
  supabase: SupabaseClient,
  membershipId: string,
  column: MembershipPublishCounter,
  options?: IncrementOptions,
): void {
  if (options?.skip) return;

  const logContext = options?.logContext ?? "incrementMembershipPublishCounter";

  void supabase
    .rpc("increment_membership_counter", {
      p_membership_id: membershipId,
      p_column_name: column,
    })
    .then(({ error }) => {
      if (error) {
        console.error(`[${logContext}] counter increment failed`, error.message);
      }
    });
}
