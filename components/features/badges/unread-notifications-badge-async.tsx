import { cache } from "react";
import { SyncUnreadCount } from "@/components/features/notifications/unread-notifications-count";
import { countUnreadNotifications } from "@/lib/queries/notifications";
import { createClient } from "@/lib/supabase/server";

export const getCachedUnreadNotificationsCount = cache(
  async (communeId: string) => {
    const supabase = await createClient();
    return countUnreadNotifications(supabase, communeId);
  },
);

/**
 * Server component. Publishes the unread total into the client badge.
 * Renders nothing: the pill lives on the bell so it can drop on click.
 */
export async function UnreadNotificationsBadgeAsync({
  communeId,
}: {
  communeId: string;
}) {
  const count = await getCachedUnreadNotificationsCount(communeId);

  return (
    <SyncUnreadCount
      count={count}
      communeId={communeId}
      revision={crypto.randomUUID()}
    />
  );
}
