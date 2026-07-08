import { createServiceClient } from "@/lib/supabase/server";
import { notifyUser } from "@/lib/services/push-notifications";

export type EngagementPrefKey =
  | "notify_initiative_support"
  | "notify_event_participation"
  | "notify_event_volunteer";

type NotifyAuthorEngagementParams = {
  authorMembershipId: string;
  actorUserId: string;
  actorName: string;
  prefKey: EngagementPrefKey;
  title: string;
  body: string;
  url: string;
  tag: string;
  payloadJson: Record<string, unknown>;
};

async function shouldNotifyEngagement(
  authorUserId: string,
  prefKey: EngagementPrefKey,
): Promise<boolean> {
  let supabase;
  try {
    supabase = await createServiceClient();
  } catch {
    return false;
  }

  const { data } = await supabase
    .from("user_notification_preferences")
    .select(prefKey)
    .eq("user_id", authorUserId)
    .maybeSingle();

  if (!data) return true;
  return (data as Record<string, boolean>)[prefKey] !== false;
}

/**
 * Notify a content author when a neighbor engages with their initiative or event.
 * Best-effort: never throws; skips self-actions and opted-out users.
 */
export async function notifyAuthorEngagement(
  params: NotifyAuthorEngagementParams,
): Promise<void> {
  let supabase;
  try {
    supabase = await createServiceClient();
  } catch {
    return;
  }

  const { data: authorMembership } = await supabase
    .from("memberships")
    .select("user_id")
    .eq("id", params.authorMembershipId)
    .maybeSingle();

  const authorUserId = authorMembership?.user_id;
  if (!authorUserId || authorUserId === params.actorUserId) return;

  const allowed = await shouldNotifyEngagement(authorUserId, params.prefKey);
  if (!allowed) return;

  await notifyUser(authorUserId, {
    title: params.title,
    body: params.body,
    url: params.url,
    tag: params.tag,
    payloadJson: params.payloadJson,
  });
}
