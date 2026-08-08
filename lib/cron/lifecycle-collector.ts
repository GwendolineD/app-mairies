import type { SupabaseClient } from "@supabase/supabase-js";

import { ROUTES } from "@/lib/constants/routes";
import { addDaysParisYmd, DAY_MS } from "@/lib/datetime";
import { generateUnsubscribeToken } from "@/lib/email/unsubscribe-token";
import { notifyUser } from "@/lib/services/push-notifications";
import { getEmailsByUserIds } from "@/lib/services/user-emails";
import { getAppUrl } from "@/lib/utils/app-url";
import type { Database } from "@/lib/types/database.types";

type ServiceClient = SupabaseClient<Database>;
type EmailQueueInsert = Database["public"]["Tables"]["email_queue"]["Insert"];

type PhaseError = {
  phase: string;
  message: string;
};

type CollectorResult = {
  purgedAnnouncements: number;
  purgedConversations: number;
  queued: {
    invites: number;
    engagement: number;
    announcementExpired: number;
    announcementStale: number;
    initiativeStale: number;
    eventPast: number;
    notificationReminder: number;
  };
  failedPhases: PhaseError[];
};

function buildUnsubscribeLink(userId: string): string {
  const token = generateUnsubscribeToken(userId);
  return `${getAppUrl()}/unsubscribe?token=${token}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Purge
// ─────────────────────────────────────────────────────────────────────────────

async function purgeArchivedAnnouncements(service: ServiceClient): Promise<number> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * DAY_MS).toISOString();
  const { data, error } = await service
    .from("announcements")
    .delete()
    .eq("status", "archivee")
    .not("archived_at", "is", null)
    .lt("archived_at", thirtyDaysAgo)
    .limit(500)
    .select("id");

  if (error) throw new Error(`purgeArchivedAnnouncements: ${error.message}`);
  return data?.length ?? 0;
}

export async function purgeArchivedConversations(service: ServiceClient): Promise<number> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * DAY_MS).toISOString();

  // Remove participant rows archived > 30 days (same effect as "permanently delete")
  // Bounded to 200: each conversation has up to 2 participants, so worst case is
  // 100 conversations, keeping the subsequent grouped read well under max_rows.
  const { data: removed, error: rmErr } = await service
    .from("conversation_participants")
    .delete()
    .not("archived_at", "is", null)
    .lt("archived_at", thirtyDaysAgo)
    .limit(200)
    .select("conversation_id");

  if (rmErr) throw new Error(`purgeArchivedConversations(participants): ${rmErr.message}`);

  const purgedCount = removed?.length ?? 0;
  if (purgedCount === 0) return 0;

  // Clean up orphan conversations (no participants left)
  // Grouped read replaces N+1 COUNT loop: fetch all remaining participants for
  // the affected conversations in one query, then delete those not in the result.
  const conversationIds = [...new Set(removed!.map((r) => r.conversation_id))];

  const { data: remaining, error: readErr } = await service
    .from("conversation_participants")
    .select("conversation_id")
    .in("conversation_id", conversationIds);

  if (readErr) throw new Error(`purgeArchivedConversations(check): ${readErr.message}`);

  const stillHasParticipants = new Set((remaining ?? []).map((r) => r.conversation_id));
  const orphanIds = conversationIds.filter((id) => !stillHasParticipants.has(id));

  if (orphanIds.length > 0) {
    // ON DELETE CASCADE on messages.conversation_id handles message cleanup
    const { error: delErr } = await service
      .from("conversations")
      .delete()
      .in("id", orphanIds);

    if (delErr) throw new Error(`purgeArchivedConversations(delete): ${delErr.message}`);
  }

  return purgedCount;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: batch check email opt-in preferences
// ─────────────────────────────────────────────────────────────────────────────

async function getEmailLifecyclePrefs(
  service: ServiceClient,
  userIds: string[],
): Promise<Map<string, boolean>> {
  const map = new Map<string, boolean>();
  if (userIds.length === 0) return map;

  const { data } = await service
    .from("user_notification_preferences")
    .select("user_id, email_lifecycle_enabled")
    .in("user_id", userIds);

  for (const row of data ?? []) {
    map.set(row.user_id, row.email_lifecycle_enabled ?? true);
  }

  // Default to true for users without a preferences row
  for (const userId of userIds) {
    if (!map.has(userId)) {
      map.set(userId, true);
    }
  }

  return map;
}

// ─────────────────────────────────────────────────────────────────────────────
// Collect: invite reminders (3 days, no signup)
// ─────────────────────────────────────────────────────────────────────────────

async function collectInviteReminders(service: ServiceClient): Promise<number> {
  const threeDaysAgo = new Date(Date.now() - 3 * DAY_MS).toISOString();
  const appUrl = getAppUrl();

  const { data: invites, error } = await service
    .from("neighbor_invites")
    .select("id, email, token, commune_id, inviter_membership_id")
    .is("accepted_at", null)
    .is("reminder_sent_at", null)
    .lt("created_at", threeDaysAgo)
    .limit(200);

  if (error) throw new Error(`collectInviteReminders: ${error.message}`);
  if (!invites || invites.length === 0) return 0;

  const membershipIds = [...new Set(invites.map((i) => i.inviter_membership_id))];
  const { data: memberships } = await service
    .from("memberships")
    .select("id, user_id, commune_id")
    .in("id", membershipIds);

  const { data: profiles } = await service
    .from("profiles")
    .select("user_id, display_name")
    .in("user_id", (memberships ?? []).map((m) => m.user_id));

  const { data: communes } = await service
    .from("communes")
    .select("id, name, insee_code")
    .in("id", [...new Set(invites.map((i) => i.commune_id))]);

  const communeMap = new Map((communes ?? []).map((c) => [c.id, c]));
  const membershipMap = new Map((memberships ?? []).map((m) => [m.id, m]));
  const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p.display_name]));

  const queueRows = invites.map((invite) => {
    const membership = membershipMap.get(invite.inviter_membership_id);
    const senderName = membership ? (profileMap.get(membership.user_id) ?? "Un voisin") : "Un voisin";
    const commune = communeMap.get(invite.commune_id);
    const communeName = commune?.name ?? "";
    const inseeCode = commune?.insee_code;
    const inviteLink = `${appUrl}/inscription?invite=${invite.token}${inseeCode ? `&commune=${encodeURIComponent(inseeCode)}` : ""}${invite.email ? `&email=${encodeURIComponent(invite.email)}` : ""}`;
    return {
      to_email: invite.email,
      template_slug: "invite-reminder",
      variables: {
        sender_name: senderName,
        commune_name: communeName,
        invite_link: inviteLink,
      },
      related_content_type: "neighbor_invite",
      related_content_id: invite.id,
    };
  });

  const { error: insertErr } = await service.from("email_queue").insert(queueRows);
  if (insertErr) throw new Error(`collectInviteReminders(insert): ${insertErr.message}`);

  await service
    .from("neighbor_invites")
    .update({ reminder_sent_at: new Date().toISOString() })
    .in("id", invites.map((i) => i.id));

  return invites.length;
}

// ─────────────────────────────────────────────────────────────────────────────
// Collect: engagement reminders (3-30 day old users with no content)
// ─────────────────────────────────────────────────────────────────────────────

export async function collectEngagementReminders(service: ServiceClient): Promise<number> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * DAY_MS).toISOString();
  const threeDaysAgo = new Date(Date.now() - 3 * DAY_MS).toISOString();
  const appUrl = getAppUrl();

  // Single RPC call replaces five queries + in-memory filtering.
  // The SQL function filters out users who have published content and those
  // already queued, making the selection exact and idempotent.
  const { data: candidates, error } = await service.rpc("select_engagement_candidates", {
    p_created_after: thirtyDaysAgo,
    p_created_before: threeDaysAgo,
    p_limit: 200,
  });

  if (error) throw new Error(`collectEngagementReminders(rpc): ${error.message}`);
  if (!candidates || candidates.length === 0) return 0;

  const userIds = candidates.map((c) => c.user_id);

  // Batch: emails, preferences, communes
  const [emailMap, emailPrefs] = await Promise.all([
    getEmailsByUserIds(service, userIds),
    getEmailLifecyclePrefs(service, userIds),
  ]);

  const communeIds = [...new Set(candidates.map((c) => c.active_commune_id).filter(Boolean))];
  const { data: communes, error: communeError } = await service
    .from("communes")
    .select("id, name")
    .in("id", communeIds as string[]);
  if (communeError) throw new Error(`collectEngagementReminders(communes): ${communeError.message}`);
  const communeMap = new Map((communes ?? []).map((c) => [c.id, c.name]));

  const queueRows: EmailQueueInsert[] = [];
  const notifiedUserIds: string[] = [];

  for (const candidate of candidates) {
    const email = emailMap.get(candidate.user_id);
    if (!email) continue;

    const emailEnabled = emailPrefs.get(candidate.user_id) ?? true;
    const communeName = communeMap.get(candidate.active_commune_id ?? "") ?? "";

    if (emailEnabled) {
      queueRows.push({
        to_email: email,
        template_slug: "engagement-first-week",
        recipient_user_id: candidate.user_id,
        variables: {
          user_name: candidate.display_name ?? "Voisin·e",
          commune_name: communeName,
          app_url: `${appUrl}${ROUTES.annonces.new()}`,
          unsubscribe_link: buildUnsubscribeLink(candidate.user_id),
        },
      });
    }

    notifiedUserIds.push(candidate.user_id);
    // Fire-and-forget push notification (see sujet 4 for await-all fix)
    void notifyUser(candidate.user_id, {
      title: "Publiez votre première annonce !",
      body: `Partagez un coup de main ou une offre avec vos voisins de ${communeName}`,
      url: ROUTES.annonces.new(),
      tag: "engagement-first-week",
    });
  }

  if (queueRows.length > 0) {
    const { error: insertError } = await service.from("email_queue").insert(queueRows);
    if (insertError) throw new Error(`collectEngagementReminders(insert): ${insertError.message}`);
  }

  if (notifiedUserIds.length > 0) {
    const { error: updateError } = await service
      .from("profiles")
      .update({ engagement_reminder_sent_at: new Date().toISOString() })
      .in("user_id", notifiedUserIds);
    if (updateError) throw new Error(`collectEngagementReminders(mark): ${updateError.message}`);
  }

  return notifiedUserIds.length;
}

// ─────────────────────────────────────────────────────────────────────────────
// Collect: announcement expired nudges (target_date + 2 days)
// ─────────────────────────────────────────────────────────────────────────────

async function collectAnnouncementExpiredNudges(service: ServiceClient): Promise<number> {
  const now = new Date();
  const twoDaysAgoYmd = addDaysParisYmd(-2, now);
  const appUrl = getAppUrl();

  const { data: announcements, error } = await service
    .from("announcements")
    .select("id, title, author_membership_id, commune_id, target_date, nudge_snoozed_until")
    .eq("status", "ouverte")
    .not("target_date", "is", null)
    .lt("target_date", twoDaysAgoYmd)
    .is("post_date_email_sent_at", null)
    .limit(200);

  if (error) throw new Error(`collectAnnouncementExpiredNudges: ${error.message}`);
  if (!announcements || announcements.length === 0) return 0;

  // Filter snoozed
  const eligible = announcements.filter(
    (a) => !a.nudge_snoozed_until || new Date(a.nudge_snoozed_until) <= now,
  );
  if (eligible.length === 0) return 0;

  const membershipIds = [...new Set(eligible.map((a) => a.author_membership_id))];
  const { data: memberships } = await service
    .from("memberships")
    .select("id, user_id")
    .in("id", membershipIds);
  const membershipUserMap = new Map((memberships ?? []).map((m) => [m.id, m.user_id]));

  const userIds = [...new Set([...(memberships ?? []).map((m) => m.user_id)])];
  const { data: profiles } = await service
    .from("profiles")
    .select("user_id, display_name")
    .in("user_id", userIds);
  const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p.display_name]));

  // Batch: emails and preferences
  const [emailMap, emailPrefs] = await Promise.all([
    getEmailsByUserIds(service, userIds),
    getEmailLifecyclePrefs(service, userIds),
  ]);

  const queueRows: EmailQueueInsert[] = [];
  const processedIds: string[] = [];

  for (const ann of eligible) {
    const userId = membershipUserMap.get(ann.author_membership_id);
    if (!userId) continue;

    const email = emailMap.get(userId);
    const userName = profileMap.get(userId) ?? "Voisin·e";
    const announcementUrl = `${appUrl}${ROUTES.annonces.detail(ann.id)}`;

    const emailEnabled = emailPrefs.get(userId) ?? true;
    if (emailEnabled && email) {
      queueRows.push({
        to_email: email,
        template_slug: "announcement-expired-nudge",
        recipient_user_id: userId,
        variables: {
          user_name: userName,
          announcement_title: ann.title,
          announcement_url: announcementUrl,
          unsubscribe_link: buildUnsubscribeLink(userId),
        },
        related_content_type: "announcement",
        related_content_id: ann.id,
      });
    }

    processedIds.push(ann.id);
    void notifyUser(userId, {
      title: "Échéance dépassée",
      body: `Votre annonce « ${ann.title} » a dépassé son échéance`,
      url: ROUTES.annonces.detail(ann.id),
      tag: `nudge:announcement:${ann.id}`,
    });
  }

  if (queueRows.length > 0) {
    const { error } = await service.from("email_queue").insert(queueRows);
    if (error) throw new Error(`collectAnnouncementExpiredNudges(insert): ${error.message}`);
  }
  if (processedIds.length > 0) {
    await service
      .from("announcements")
      .update({ post_date_email_sent_at: now.toISOString() })
      .in("id", processedIds);
  }

  return processedIds.length;
}

// ─────────────────────────────────────────────────────────────────────────────
// Collect: announcement stale 60d (no target_date, created > 60 days)
// ─────────────────────────────────────────────────────────────────────────────

async function collectAnnouncementStaleNudges(service: ServiceClient): Promise<number> {
  const now = new Date();
  const sixtyDaysAgo = new Date(now.getTime() - 60 * DAY_MS).toISOString();
  const appUrl = getAppUrl();

  const { data: announcements, error } = await service
    .from("announcements")
    .select("id, title, author_membership_id, nudge_snoozed_until")
    .eq("status", "ouverte")
    .is("target_date", null)
    .lt("created_at", sixtyDaysAgo)
    .is("stale_60d_email_sent_at", null)
    .limit(200);

  if (error) throw new Error(`collectAnnouncementStaleNudges: ${error.message}`);
  if (!announcements || announcements.length === 0) return 0;

  const eligible = announcements.filter(
    (a) => !a.nudge_snoozed_until || new Date(a.nudge_snoozed_until) <= now,
  );
  if (eligible.length === 0) return 0;

  const membershipIds = [...new Set(eligible.map((a) => a.author_membership_id))];
  const { data: memberships } = await service
    .from("memberships")
    .select("id, user_id")
    .in("id", membershipIds);
  const membershipUserMap = new Map((memberships ?? []).map((m) => [m.id, m.user_id]));

  const userIds = [...new Set([...(memberships ?? []).map((m) => m.user_id)])];
  const { data: profiles } = await service
    .from("profiles")
    .select("user_id, display_name")
    .in("user_id", userIds);
  const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p.display_name]));

  // Batch: emails and preferences
  const [emailMap, emailPrefs] = await Promise.all([
    getEmailsByUserIds(service, userIds),
    getEmailLifecyclePrefs(service, userIds),
  ]);

  const queueRows: EmailQueueInsert[] = [];
  const processedIds: string[] = [];

  for (const ann of eligible) {
    const userId = membershipUserMap.get(ann.author_membership_id);
    if (!userId) continue;

    const email = emailMap.get(userId);
    const userName = profileMap.get(userId) ?? "Voisin·e";
    const announcementUrl = `${appUrl}${ROUTES.annonces.detail(ann.id)}`;

    const emailEnabled = emailPrefs.get(userId) ?? true;
    if (emailEnabled && email) {
      queueRows.push({
        to_email: email,
        template_slug: "announcement-stale-60d",
        recipient_user_id: userId,
        variables: {
          user_name: userName,
          announcement_title: ann.title,
          announcement_url: announcementUrl,
          unsubscribe_link: buildUnsubscribeLink(userId),
        },
        related_content_type: "announcement",
        related_content_id: ann.id,
      });
    }

    processedIds.push(ann.id);
    void notifyUser(userId, {
      title: "Annonce active depuis 2 mois",
      body: `Votre annonce « ${ann.title} » est-elle toujours d'actualité ?`,
      url: ROUTES.annonces.detail(ann.id),
      tag: `nudge:announcement:${ann.id}`,
    });
  }

  if (queueRows.length > 0) {
    const { error } = await service.from("email_queue").insert(queueRows);
    if (error) throw new Error(`collectAnnouncementStaleNudges(insert): ${error.message}`);
  }
  if (processedIds.length > 0) {
    await service
      .from("announcements")
      .update({ stale_60d_email_sent_at: now.toISOString() })
      .in("id", processedIds);
  }

  return processedIds.length;
}

// ─────────────────────────────────────────────────────────────────────────────
// Collect: initiative stale 60d
// ─────────────────────────────────────────────────────────────────────────────

async function collectInitiativeStaleNudges(service: ServiceClient): Promise<number> {
  const now = new Date();
  const sixtyDaysAgo = new Date(now.getTime() - 60 * DAY_MS).toISOString();
  const appUrl = getAppUrl();

  const { data: initiatives, error } = await service
    .from("initiatives")
    .select("id, title, author_membership_id, nudge_snoozed_until")
    .eq("status", "active")
    .lt("created_at", sixtyDaysAgo)
    .is("stale_60d_email_sent_at", null)
    .limit(200);

  if (error) throw new Error(`collectInitiativeStaleNudges: ${error.message}`);
  if (!initiatives || initiatives.length === 0) return 0;

  const eligible = initiatives.filter(
    (i) => !i.nudge_snoozed_until || new Date(i.nudge_snoozed_until) <= now,
  );
  if (eligible.length === 0) return 0;

  const membershipIds = [...new Set(eligible.map((i) => i.author_membership_id))];
  const { data: memberships } = await service
    .from("memberships")
    .select("id, user_id")
    .in("id", membershipIds);
  const membershipUserMap = new Map((memberships ?? []).map((m) => [m.id, m.user_id]));

  const userIds = [...new Set([...(memberships ?? []).map((m) => m.user_id)])];
  const { data: profiles } = await service
    .from("profiles")
    .select("user_id, display_name")
    .in("user_id", userIds);
  const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p.display_name]));

  // Batch: emails and preferences
  const [emailMap, emailPrefs] = await Promise.all([
    getEmailsByUserIds(service, userIds),
    getEmailLifecyclePrefs(service, userIds),
  ]);

  const queueRows: EmailQueueInsert[] = [];
  const processedIds: string[] = [];

  for (const ini of eligible) {
    const userId = membershipUserMap.get(ini.author_membership_id);
    if (!userId) continue;

    const email = emailMap.get(userId);
    const userName = profileMap.get(userId) ?? "Voisin·e";
    const initiativeUrl = `${appUrl}${ROUTES.initiatives.detail(ini.id)}`;

    const emailEnabled = emailPrefs.get(userId) ?? true;
    if (emailEnabled && email) {
      queueRows.push({
        to_email: email,
        template_slug: "initiative-stale-60d",
        recipient_user_id: userId,
        variables: {
          user_name: userName,
          initiative_title: ini.title,
          initiative_url: initiativeUrl,
          unsubscribe_link: buildUnsubscribeLink(userId),
        },
        related_content_type: "initiative",
        related_content_id: ini.id,
      });
    }

    processedIds.push(ini.id);
    void notifyUser(userId, {
      title: "Initiative active depuis 2 mois",
      body: `Votre initiative « ${ini.title} » est-elle toujours d'actualité ?`,
      url: ROUTES.initiatives.detail(ini.id),
      tag: `nudge:initiative:${ini.id}`,
    });
  }

  if (queueRows.length > 0) {
    const { error } = await service.from("email_queue").insert(queueRows);
    if (error) throw new Error(`collectInitiativeStaleNudges(insert): ${error.message}`);
  }
  if (processedIds.length > 0) {
    await service
      .from("initiatives")
      .update({ stale_60d_email_sent_at: now.toISOString() })
      .in("id", processedIds);
  }

  return processedIds.length;
}

// ─────────────────────────────────────────────────────────────────────────────
// Collect: event past nudges (ends_at + 2 days)
// ─────────────────────────────────────────────────────────────────────────────

async function collectEventPastNudges(service: ServiceClient): Promise<number> {
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 2 * DAY_MS).toISOString();
  const appUrl = getAppUrl();

  const { data: events, error } = await service
    .from("events")
    .select("id, title, author_membership_id, nudge_snoozed_until")
    .eq("status", "active")
    .lt("ends_at", twoDaysAgo)
    .is("post_event_email_sent_at", null)
    .limit(200);

  if (error) throw new Error(`collectEventPastNudges: ${error.message}`);
  if (!events || events.length === 0) return 0;

  const eligible = events.filter(
    (e) => !e.nudge_snoozed_until || new Date(e.nudge_snoozed_until) <= now,
  );
  if (eligible.length === 0) return 0;

  const membershipIds = [...new Set(eligible.map((e) => e.author_membership_id))];
  const { data: memberships } = await service
    .from("memberships")
    .select("id, user_id")
    .in("id", membershipIds);
  const membershipUserMap = new Map((memberships ?? []).map((m) => [m.id, m.user_id]));

  const userIds = [...new Set([...(memberships ?? []).map((m) => m.user_id)])];
  const { data: profiles } = await service
    .from("profiles")
    .select("user_id, display_name")
    .in("user_id", userIds);
  const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p.display_name]));

  // Batch: emails and preferences
  const [emailMap, emailPrefs] = await Promise.all([
    getEmailsByUserIds(service, userIds),
    getEmailLifecyclePrefs(service, userIds),
  ]);

  const queueRows: EmailQueueInsert[] = [];
  const processedIds: string[] = [];

  for (const evt of eligible) {
    const userId = membershipUserMap.get(evt.author_membership_id);
    if (!userId) continue;

    const email = emailMap.get(userId);
    const userName = profileMap.get(userId) ?? "Voisin·e";
    const eventUrl = `${appUrl}${ROUTES.evenements.detail(evt.id)}`;

    const emailEnabled = emailPrefs.get(userId) ?? true;
    if (emailEnabled && email) {
      queueRows.push({
        to_email: email,
        template_slug: "event-past-nudge",
        recipient_user_id: userId,
        variables: {
          user_name: userName,
          event_title: evt.title,
          event_url: eventUrl,
          unsubscribe_link: buildUnsubscribeLink(userId),
        },
        related_content_type: "event",
        related_content_id: evt.id,
      });
    }

    processedIds.push(evt.id);
    void notifyUser(userId, {
      title: "Événement terminé",
      body: `Votre événement « ${evt.title} » est terminé. Souhaitez-vous le supprimer ?`,
      url: ROUTES.evenements.detail(evt.id),
      tag: `nudge:event:${evt.id}`,
    });
  }

  if (queueRows.length > 0) {
    const { error } = await service.from("email_queue").insert(queueRows);
    if (error) throw new Error(`collectEventPastNudges(insert): ${error.message}`);
  }
  if (processedIds.length > 0) {
    await service
      .from("events")
      .update({ post_event_email_sent_at: now.toISOString() })
      .in("id", processedIds);
  }

  return processedIds.length;
}

// ─────────────────────────────────────────────────────────────────────────────
// Collect: notification activation reminders (1-7 day users without push)
// ─────────────────────────────────────────────────────────────────────────────

export async function collectNotificationReminders(service: ServiceClient): Promise<number> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS).toISOString();
  const oneDayAgo = new Date(now.getTime() - DAY_MS).toISOString();

  // Single RPC call replaces profiles query + push_subscriptions check + in-memory filtering.
  // The SQL function filters out users who have push subscriptions and those
  // already queued, making the selection exact and idempotent.
  const { data: candidates, error } = await service.rpc("select_notification_activation_candidates", {
    p_created_after: sevenDaysAgo,
    p_created_before: oneDayAgo,
    p_limit: 200,
  });

  if (error) throw new Error(`collectNotificationReminders(rpc): ${error.message}`);
  if (!candidates || candidates.length === 0) return 0;

  const userIds = candidates.map((c) => c.user_id);

  // Batch: emails and preferences
  const [emailMap, emailPrefs] = await Promise.all([
    getEmailsByUserIds(service, userIds),
    getEmailLifecyclePrefs(service, userIds),
  ]);

  const communeIds = [...new Set(candidates.map((c) => c.active_commune_id).filter(Boolean))];
  const { data: communes, error: communeError } = await service
    .from("communes")
    .select("id, name")
    .in("id", communeIds as string[]);
  if (communeError) throw new Error(`collectNotificationReminders(communes): ${communeError.message}`);
  const communeMap = new Map((communes ?? []).map((c) => [c.id, c.name]));

  const queueRows: EmailQueueInsert[] = [];
  const notifiedUserIds: string[] = [];

  for (const candidate of candidates) {
    const email = emailMap.get(candidate.user_id);
    if (!email) continue;

    const communeName = communeMap.get(candidate.active_commune_id ?? "") ?? "";
    const emailEnabled = emailPrefs.get(candidate.user_id) ?? true;

    if (emailEnabled) {
      queueRows.push({
        to_email: email,
        template_slug: "notification-activation-reminder",
        recipient_user_id: candidate.user_id,
        variables: {
          user_name: candidate.display_name ?? "Voisin·e",
          commune_name: communeName,
          unsubscribe_link: buildUnsubscribeLink(candidate.user_id),
        },
      });
    }

    notifiedUserIds.push(candidate.user_id);
    // Fire-and-forget push notification (see sujet 4 for await-all fix)
    void notifyUser(candidate.user_id, {
      title: "Activez les notifications",
      body: "Ne manquez pas les annonces et événements de votre commune !",
      url: `${ROUTES.profil}?tab=parametres`,
      tag: "notification-activation-reminder",
    });
  }

  if (queueRows.length > 0) {
    const { error: insertError } = await service.from("email_queue").insert(queueRows);
    if (insertError) throw new Error(`collectNotificationReminders(insert): ${insertError.message}`);
  }
  if (notifiedUserIds.length > 0) {
    const { error: updateError } = await service
      .from("profiles")
      .update({ notification_prompt_email_sent_at: now.toISOString() })
      .in("user_id", notifiedUserIds);
    if (updateError) throw new Error(`collectNotificationReminders(mark): ${updateError.message}`);
  }

  return notifiedUserIds.length;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main orchestrator
// ─────────────────────────────────────────────────────────────────────────────

export async function runLifecycleCollector(service: ServiceClient): Promise<CollectorResult> {
  const failedPhases: PhaseError[] = [];

  // Helper to run a phase with isolated error handling
  async function runPhase<T>(name: string, fn: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      failedPhases.push({ phase: name, message });
      console.error(`[lifecycle-collector] ${name} failed:`, message);
      return fallback;
    }
  }

  const purgedAnnouncements = await runPhase("purgeArchivedAnnouncements", () => purgeArchivedAnnouncements(service), 0);
  const purgedConversations = await runPhase("purgeArchivedConversations", () => purgeArchivedConversations(service), 0);

  const invites = await runPhase("collectInviteReminders", () => collectInviteReminders(service), 0);
  const engagement = await runPhase("collectEngagementReminders", () => collectEngagementReminders(service), 0);
  const announcementExpired = await runPhase("collectAnnouncementExpiredNudges", () => collectAnnouncementExpiredNudges(service), 0);
  const announcementStale = await runPhase("collectAnnouncementStaleNudges", () => collectAnnouncementStaleNudges(service), 0);
  const initiativeStale = await runPhase("collectInitiativeStaleNudges", () => collectInitiativeStaleNudges(service), 0);
  const eventPast = await runPhase("collectEventPastNudges", () => collectEventPastNudges(service), 0);
  const notificationReminder = await runPhase("collectNotificationReminders", () => collectNotificationReminders(service), 0);

  return {
    purgedAnnouncements,
    purgedConversations,
    queued: {
      invites,
      engagement,
      announcementExpired,
      announcementStale,
      initiativeStale,
      eventPast,
      notificationReminder,
    },
    failedPhases,
  };
}
