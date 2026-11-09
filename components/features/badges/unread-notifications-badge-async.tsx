import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { countUnreadNotifications } from "@/lib/queries/notifications";

export const getCachedUnreadNotificationsCount = cache(
  async (communeId: string) => {
    const supabase = await createClient();
    return countUnreadNotifications(supabase, communeId);
  },
);

/** Server component — coral pill anchored to the top-right of the bell icon. */
export async function UnreadNotificationsBadgeAsync({
  communeId,
}: {
  communeId: string;
}) {
  const count = await getCachedUnreadNotificationsCount(communeId);
  if (count <= 0) return null;

  return (
    <span
      aria-label={`${count} notifications non lues`}
      className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 text-[9px] font-bold leading-none text-white"
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}
