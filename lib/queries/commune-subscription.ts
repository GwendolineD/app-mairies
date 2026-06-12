import type { SupabaseClient } from "@supabase/supabase-js";

export type SubscriptionPeriod = {
  id: string;
  starts_at: string;
  ends_at: string;
  amount_cents: number;
  payment_status: "paid" | "unpaid";
  auto_renew: boolean;
  created_at: string;
  paid_at: string | null;
  payment_method: string | null;
};

export type SubscriptionCancellation = {
  id: string;
  subscription_id: string | null;
  comment: string;
  requested_by_user_id: string;
  requester_name: string | null;
  created_at: string;
};

export type CommuneSubscriptionInfo = {
  subscribedSince: string | null;
  periods: SubscriptionPeriod[];
  cancellations: SubscriptionCancellation[];
  hasActiveAutoRenew: boolean;
};

export async function getCommuneSubscriptionInfo(
  supabase: SupabaseClient,
  communeId: string,
): Promise<CommuneSubscriptionInfo> {
  const [communeResult, periodsResult, cancellationResult] = await Promise.all([
    supabase
      .from("communes")
      .select("subscribed_since")
      .eq("id", communeId)
      .single(),
    supabase
      .from("commune_subscriptions")
      .select("id, starts_at, ends_at, amount_cents, payment_status, auto_renew, created_at, paid_at, payment_method")
      .eq("commune_id", communeId)
      .order("starts_at", { ascending: false }),
    supabase
      .from("cancellation_requests")
      .select("id, subscription_id, comment, requested_by_user_id, created_at")
      .eq("commune_id", communeId)
      .order("created_at", { ascending: false }),
  ]);

  const periods: SubscriptionPeriod[] = (periodsResult.data ?? []).map((row) => ({
    id: row.id,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    amount_cents: row.amount_cents,
    payment_status: row.payment_status as "paid" | "unpaid",
    auto_renew: row.auto_renew,
    created_at: row.created_at,
    paid_at: row.paid_at,
    payment_method: row.payment_method,
  }));

  const cancellationRows = cancellationResult.data ?? [];
  const requesterIds = [
    ...new Set(cancellationRows.map((row) => row.requested_by_user_id)),
  ];

  const requesterNames = new Map<string, string | null>();
  if (requesterIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, first_name, last_name")
      .in("user_id", requesterIds);

    for (const profile of profiles ?? []) {
      const name =
        profile.display_name ??
        ([profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
          null);
      requesterNames.set(profile.user_id, name);
    }
  }

  const cancellations: SubscriptionCancellation[] = cancellationRows.map(
    (row) => ({
      id: row.id,
      subscription_id: row.subscription_id,
      comment: row.comment,
      requested_by_user_id: row.requested_by_user_id,
      requester_name: requesterNames.get(row.requested_by_user_id) ?? null,
      created_at: row.created_at,
    }),
  );

  const now = new Date().toISOString().slice(0, 10);
  const hasActiveAutoRenew = periods.some(
    (p) => p.ends_at >= now && p.auto_renew,
  );

  return {
    subscribedSince: communeResult.data?.subscribed_since ?? null,
    periods,
    cancellations,
    hasActiveAutoRenew,
  };
}
