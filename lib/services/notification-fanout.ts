/**
 * Fanout helpers: when a new annoucement / initiative / event is published,
 * notify every member of the commune that opted-in via their notification
 * preferences. Each notification is *also* persisted in `public.notifications`
 * so users see them in-app even without push.
 *
 * Designed to run after the canonical write succeeds (best-effort, never throws).
 */

import { ROUTES } from "@/lib/constants/routes";
import { createServiceClient } from "@/lib/supabase/server";
import { notifyUser } from "@/lib/services/push-notifications";
import type {
  ConversationContextType,
  NotificationPreferenceKey,
} from "@/lib/types";

type FanoutInput = {
  contextType: ConversationContextType;
  contextId: string;
  communeId: string;
  authorUserId: string;
  title: string;
  authorDisplayName?: string | null;
};

const PREF_COLUMN: Record<ConversationContextType, NotificationPreferenceKey> = {
  announcement: "notify_new_announcement",
  initiative: "notify_new_initiative",
  event: "notify_new_event",
};

const KIND_LABEL: Record<ConversationContextType, string> = {
  announcement: "Nouvelle annonce",
  initiative: "Nouvelle initiative",
  event: "Nouvel événement",
};

const ROUTE_BUILDER: Record<ConversationContextType, (id: string) => string> = {
  announcement: (id) => ROUTES.annonces.detail(id),
  initiative: (id) => ROUTES.initiatives.detail(id),
  event: (id) => ROUTES.evenements.detail(id),
};

/**
 * Fan out a "new content" notification to opted-in commune members.
 * Uses the service-role client (RLS bypass) so it can read across users.
 * Author is excluded from recipients.
 */
export async function fanoutNewContentNotification(
  input: FanoutInput,
): Promise<void> {
  try {
    const supabase = await createServiceClient();
    const prefColumn = PREF_COLUMN[input.contextType];

    // Find every active member of the commune.
    const { data: memberships } = await supabase
      .from("memberships")
      .select("user_id")
      .eq("commune_id", input.communeId)
      .eq("status", "active")
      .neq("user_id", input.authorUserId);

    const userIds = Array.from(
      new Set((memberships ?? []).map((m) => m.user_id as string)),
    );
    if (userIds.length === 0) return;

    // Among those users, find who opted-in for this kind of new-content notification.
    const { data: prefs } = await supabase
      .from("user_notification_preferences")
      .select(`user_id, ${prefColumn}`)
      .in("user_id", userIds);

    const optedIn = new Set(
      (prefs ?? [])
        .filter((p) => (p as Record<string, unknown>)[prefColumn] === true)
        .map((p) => (p as { user_id: string }).user_id),
    );

    // Defaults are FALSE for "new content" preferences (per the migration),
    // so absence of a row means the user has not opted in. Notify only opted-in users.
    if (optedIn.size === 0) return;

    const title = `${KIND_LABEL[input.contextType]} dans votre commune`;
    const authorLabel = input.authorDisplayName ?? "un·e voisin·e";
    const body = `${authorLabel} vient de publier « ${truncate(input.title, 80)} »`;
    const url = ROUTE_BUILDER[input.contextType](input.contextId);

    await Promise.all(
      Array.from(optedIn).map((userId) =>
        notifyUser(userId, {
          title,
          body,
          url,
          tag: `${input.contextType}:${input.contextId}`,
          payloadJson: {
            kind: "new_content",
            context_type: input.contextType,
            context_id: input.contextId,
          },
        }),
      ),
    );
  } catch (err) {
    console.warn("[fanout] failed", err);
  }
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
