import type { SupabaseClient } from "@supabase/supabase-js";

type AdminUserEmailsRow = { user_id: string; email: string | null };

/**
 * Resolve user IDs to email addresses via the `admin_user_emails` RPC.
 *
 * This replaces direct calls to `auth.admin.listUsers()` which is capped at
 * 50 accounts per page. The RPC is restricted to service_role only.
 *
 * @throws Error if the RPC fails — returning an empty Map would silently
 *   reproduce the bug this helper is meant to fix.
 */
export async function getEmailsByUserIds(
  service: SupabaseClient,
  ids: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();

  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length === 0) return map;

  const { data, error } = await service.rpc("admin_user_emails", {
    p_user_ids: uniqueIds,
  });

  if (error) {
    throw new Error(`getEmailsByUserIds: ${error.message}`);
  }

  const rows = data as AdminUserEmailsRow[] | null;
  for (const row of rows ?? []) {
    // auth.users.email is nullable (phone-based accounts); skip nulls
    if (row.email) {
      map.set(row.user_id, row.email);
    }
  }

  return map;
}
