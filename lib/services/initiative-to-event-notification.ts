/**
 * Notify supporters of an initiative when it is transformed into an event.
 *
 * Two exported functions:
 * - getInitiativeSupporterUserIds: synchronous collection (await in the action)
 * - notifyInitiativeSupporters: push + email queue with bounded concurrency
 *
 * Sujet 4: Refactored to use bounded concurrency and batch queries to avoid
 * 414 URI Too Long errors on large supporter lists.
 */

import { ROUTES } from "@/lib/constants/routes";
import { generateUnsubscribeToken } from "@/lib/email/unsubscribe-token";
import { notifyUser, type PushPayload } from "@/lib/services/push-notifications";
import { getEmailsByUserIds } from "@/lib/services/user-emails";
import { createServiceClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/utils/app-url";
import type { Database } from "@/lib/types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

type EmailQueueInsert = Database["public"]["Tables"]["email_queue"]["Insert"];
type ServiceClient = SupabaseClient<Database>;

const QUERY_BATCH_SIZE = 150;
const PUSH_CONCURRENCY = 20;

type PushTask = {
  userId: string;
  payload: PushPayload & { payloadJson?: Record<string, unknown> };
};

function buildUnsubscribeLink(userId: string): string {
  const token = generateUnsubscribeToken(userId);
  return `${getAppUrl()}/unsubscribe?token=${token}`;
}

/**
 * Collect user IDs of active supporters for a given initiative.
 * Fast single query — designed to be awaited in the server action
 * before firing off push/email in the background.
 */
export async function getInitiativeSupporterUserIds(
  initiativeId: string,
  excludeAuthorUserId: string,
): Promise<string[]> {
  const supabase = await createServiceClient();

  const { data: responses } = await supabase
    .from("initiative_responses")
    .select("membership_id, memberships!inner(user_id, status)")
    .eq("initiative_id", initiativeId)
    .eq("response_type", "support");

  if (!responses || responses.length === 0) return [];

  const userIds = new Set<string>();
  for (const row of responses) {
    const membership = row.memberships as unknown as { user_id: string; status: string };
    if (membership.status === "active" && membership.user_id !== excludeAuthorUserId) {
      userIds.add(membership.user_id);
    }
  }

  return Array.from(userIds);
}

type NotifySupportersInput = {
  supporterUserIds: string[];
  initiativeTitle: string;
  eventId: string;
  eventTitle: string;
  eventStartsAt: string;
  communeId: string;
  authorDisplayName: string | null;
};

type NotifySupportersResult = {
  pushSent: number;
  pushFailed: number;
  emailsQueued: number;
};

/**
 * Send push notifications and enqueue emails for each supporter.
 * Uses bounded concurrency for push notifications and batched queries
 * to avoid 414 URI Too Long errors.
 */
export async function notifyInitiativeSupporters(
  input: NotifySupportersInput,
): Promise<NotifySupportersResult> {
  const result: NotifySupportersResult = { pushSent: 0, pushFailed: 0, emailsQueued: 0 };

  try {
    const supabase = await createServiceClient();
    const appUrl = getAppUrl();
    const eventUrl = `${appUrl}${ROUTES.evenements.detail(input.eventId)}`;

    const eventDate = formatEventDate(input.eventStartsAt);
    const authorLabel = input.authorDisplayName ?? "Un·e voisin·e";

    // Get commune name
    const { data: commune, error: communeError } = await supabase
      .from("communes")
      .select("name")
      .eq("id", input.communeId)
      .single();
    if (communeError) {
      console.warn("[initiative-to-event-notification] commune fetch failed", communeError.message);
    }
    const communeName = commune?.name ?? "";

    // Batch queries to avoid 414 URI Too Long
    const profileMap = await batchFetchProfiles(supabase, input.supporterUserIds);
    const emailMap = await getEmailsByUserIds(supabase, input.supporterUserIds);
    const prefMap = await batchFetchPreferences(supabase, input.supporterUserIds);

    const emailQueueRows: EmailQueueInsert[] = [];
    const pushTasks: PushTask[] = [];

    for (const userId of input.supporterUserIds) {
      const userPrefs = prefMap.get(userId) ?? { push: true, email: true };
      const displayName = profileMap.get(userId) ?? "Voisin·e";

      // Collect push task
      if (userPrefs.push) {
        pushTasks.push({
          userId,
          payload: {
            title: "L'initiative que vous soutenez se concrétise !",
            body: `« ${truncate(input.initiativeTitle, 60)} » → événement le ${eventDate}`,
            url: ROUTES.evenements.detail(input.eventId),
            tag: `initiative-to-event:${input.eventId}`,
            payloadJson: {
              kind: "initiative_to_event",
              event_id: input.eventId,
              initiative_title: input.initiativeTitle,
            },
          },
        });
      }

      // Collect email queue entry
      if (userPrefs.email) {
        const email = emailMap.get(userId);
        if (email) {
          emailQueueRows.push({
            to_email: email,
            template_slug: "initiative-to-event",
            recipient_user_id: userId,
            variables: {
              user_name: displayName,
              initiative_title: input.initiativeTitle,
              event_title: input.eventTitle,
              event_date: eventDate,
              event_url: eventUrl,
              author_name: authorLabel,
              commune_name: communeName,
              unsubscribe_link: buildUnsubscribeLink(userId),
            },
            related_content_type: "event",
            related_content_id: input.eventId,
          });
        }
      }
    }

    // Send push notifications with bounded concurrency
    const pushResult = await sendPushWithConcurrency(pushTasks);
    result.pushSent = pushResult.sent;
    result.pushFailed = pushResult.failed;

    // Insert email queue entries
    if (emailQueueRows.length > 0) {
      const { error: insertError } = await supabase.from("email_queue").insert(emailQueueRows);
      if (insertError) {
        console.warn("[initiative-to-event-notification] email queue insert failed", insertError.message);
      } else {
        result.emailsQueued = emailQueueRows.length;
      }
    }

    console.log(
      `[initiative-to-event-notification] event:${input.eventId} — ` +
      `push_sent=${result.pushSent} push_failed=${result.pushFailed} ` +
      `emails_queued=${result.emailsQueued}`,
    );
  } catch (err) {
    console.warn("[initiative-to-event-notification] failed", err);
  }

  return result;
}

async function batchFetchProfiles(
  supabase: ServiceClient,
  userIds: string[],
): Promise<Map<string, string | null>> {
  const result = new Map<string, string | null>();
  if (userIds.length === 0) return result;

  for (let i = 0; i < userIds.length; i += QUERY_BATCH_SIZE) {
    const batch = userIds.slice(i, i + QUERY_BATCH_SIZE);
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", batch);

    if (error) {
      console.warn("[initiative-to-event-notification] profiles batch fetch failed", error.message);
      continue;
    }

    for (const profile of data ?? []) {
      result.set(profile.user_id, profile.display_name);
    }
  }

  return result;
}

async function batchFetchPreferences(
  supabase: ServiceClient,
  userIds: string[],
): Promise<Map<string, { push: boolean; email: boolean }>> {
  const result = new Map<string, { push: boolean; email: boolean }>();
  if (userIds.length === 0) return result;

  for (let i = 0; i < userIds.length; i += QUERY_BATCH_SIZE) {
    const batch = userIds.slice(i, i + QUERY_BATCH_SIZE);
    const { data, error } = await supabase
      .from("user_notification_preferences")
      .select("user_id, notify_new_event, email_lifecycle_enabled")
      .in("user_id", batch);

    if (error) {
      console.warn("[initiative-to-event-notification] preferences batch fetch failed", error.message);
      continue;
    }

    for (const pref of data ?? []) {
      result.set(pref.user_id as string, {
        push: (pref.notify_new_event as boolean | null) ?? true,
        email: (pref.email_lifecycle_enabled as boolean | null) ?? true,
      });
    }
  }

  return result;
}

async function sendPushWithConcurrency(
  tasks: PushTask[],
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < tasks.length; i += PUSH_CONCURRENCY) {
    const batch = tasks.slice(i, i + PUSH_CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((task) => notifyUser(task.userId, task.payload)),
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        sent++;
      } else {
        failed++;
        console.warn("[initiative-to-event-notification] push failed", result.reason);
      }
    }
  }

  return { sent, failed };
}

function formatEventDate(isoString: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "Europe/Paris",
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
