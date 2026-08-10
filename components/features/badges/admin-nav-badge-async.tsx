import { getCachedAllPendingReportsCount } from "@/lib/queries/reports";
import { countPendingReports } from "@/lib/queries/reports";
import { getCachedOpenSupportRequestsCount } from "@/lib/queries/support-requests";
import { getCachedOpenLeadsCount } from "@/lib/queries/commune-interest-leads";
import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

export const getCachedPendingReportsCount = cache(async (communeId: string) => {
  const supabase = await createClient();
  return countPendingReports(supabase, communeId);
});

export type AdminNavBadgeVariant =
  | "sidebar-pill"
  | "sidebar-dot"
  | "bottom-pill"
  | "drawer-pill";

type BadgeVariant = AdminNavBadgeVariant;

function AdminBadgeVisual({
  count,
  variant,
}: {
  count: number;
  variant: BadgeVariant;
}) {
  if (count <= 0) return null;

  if (variant === "sidebar-dot") {
    return (
      <span className="absolute top-1 right-1 flex size-2.5 rounded-full bg-coral" />
    );
  }

  if (variant === "bottom-pill") {
    return (
      <span className="absolute -top-1 -right-1.5 flex size-3.5 items-center justify-center rounded-full bg-coral text-[8px] font-bold leading-none text-white">
        {count > 9 ? "9+" : count}
      </span>
    );
  }

  return (
    <span
      aria-label={`${count} en attente`}
      className="flex size-5 items-center justify-center rounded-full bg-coral text-[10px] font-bold text-white"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export async function PendingReportsNavBadgeAsync({
  variant,
  communeId,
}: {
  variant: BadgeVariant;
  communeId?: string;
}) {
  const count = communeId
    ? await getCachedPendingReportsCount(communeId)
    : await getCachedAllPendingReportsCount();
  return <AdminBadgeVisual count={count} variant={variant} />;
}

export async function OpenSupportNavBadgeAsync({
  variant,
}: {
  variant: BadgeVariant;
}) {
  const count = await getCachedOpenSupportRequestsCount();
  return <AdminBadgeVisual count={count} variant={variant} />;
}

export async function OpenLeadsNavBadgeAsync({
  variant,
}: {
  variant: BadgeVariant;
}) {
  const count = await getCachedOpenLeadsCount();
  return <AdminBadgeVisual count={count} variant={variant} />;
}
