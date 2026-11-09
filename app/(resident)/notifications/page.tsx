import { NotificationList } from "@/components/features/notifications/notification-list";
import { PageStack } from "@/components/ui/page-stack";
import { requireActiveMembership } from "@/lib/auth/session";
import { listMyNotifications } from "@/lib/queries/notifications";
import { createClient } from "@/lib/supabase/server";

// Per-user, per-commune feed: dynamic by construction (session cookies).
export default async function NotificationsPage() {
  const ctx = await requireActiveMembership();
  const communeId = ctx.activeMembership!.commune_id;

  const supabase = await createClient();
  const initialPage = await listMyNotifications(supabase, communeId);

  return (
    <PageStack gap="4">
      <NotificationList initialPage={initialPage} now={new Date().toISOString()} />
    </PageStack>
  );
}
