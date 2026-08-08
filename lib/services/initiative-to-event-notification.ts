/**
 * Notify supporters of an initiative when it is transformed into an event.
 *
 * Two exported functions:
 * - getInitiativeSupporterUserIds: synchronous collection (await in the action)
 * - notifyInitiativeSupporters: fire-and-forget push + email queue
 */

import { ROUTES } from "@/lib/constants/routes";
import { generateUnsubscribeToken } from "@/lib/email/unsubscribe-token";
import { notifyUser } from "@/lib/services/push-notifications";
import { getEmailsByUserIds } from "@/lib/services/user-emails";
import { createServiceClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/utils/app-url";
import type { Database } from "@/lib/types/database.types";

type EmailQueueInsert = Database["public"]["Tables"]["email_queue"]["Insert"];

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

/**
 * Send push notifications and enqueue emails for each supporter.
 * Designed to be called with `void` (fire-and-forget) — never throws.
 */
export async function notifyInitiativeSupporters(
  input: NotifySupportersInput,
): Promise<void> {
  try {
    const supabase = await createServiceClient();
    const appUrl = getAppUrl();
    const eventUrl = `${appUrl}${ROUTES.evenements.detail(input.eventId)}`;

    const eventDate = formatEventDate(input.eventStartsAt);
    const authorLabel = input.authorDisplayName ?? "Un·e voisin·e";

    // Get commune name
    const { data: commune } = await supabase
      .from("communes")
      .select("name")
      .eq("id", input.communeId)
      .single();
    const communeName = commune?.name ?? "";

    // Get user emails + display names
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", input.supporterUserIds);
    const profileMap = new Map(
      (profiles ?? []).map((p) => [p.user_id, p.display_name as string | null]),
    );

    const emailMap = await getEmailsByUserIds(supabase, input.supporterUserIds);

    // Check push preferences in batch
    const { data: prefs } = await supabase
      .from("user_notification_preferences")
      .select("user_id, notify_new_event, email_lifecycle_enabled")
      .in("user_id", input.supporterUserIds);
    const prefMap = new Map(
      (prefs ?? []).map((p) => [
        p.user_id as string,
        {
          push: (p.notify_new_event as boolean | null) ?? true,
          email: (p.email_lifecycle_enabled as boolean | null) ?? true,
        },
      ]),
    );

    const emailQueueRows: EmailQueueInsert[] = [];

    for (const userId of input.supporterUserIds) {
      const userPrefs = prefMap.get(userId) ?? { push: true, email: true };
      const displayName = profileMap.get(userId) ?? "Voisin·e";

      // Push notification
      if (userPrefs.push) {
        await notifyUser(userId, {
          title: "L'initiative que vous soutenez se concrétise !",
          body: `« ${truncate(input.initiativeTitle, 60)} » → événement le ${eventDate}`,
          url: ROUTES.evenements.detail(input.eventId),
          tag: `initiative-to-event:${input.eventId}`,
          payloadJson: {
            kind: "initiative_to_event",
            event_id: input.eventId,
            initiative_title: input.initiativeTitle,
          },
        });
      }

      // Email queue
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

    if (emailQueueRows.length > 0) {
      await supabase.from("email_queue").insert(emailQueueRows);
    }
  } catch (err) {
    console.warn("[initiative-to-event-notification] failed", err);
  }
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
