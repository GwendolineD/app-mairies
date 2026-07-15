import type { SupabaseClient } from "@supabase/supabase-js";

import { ROUTES } from "@/lib/constants/routes";
import { addDaysParisYmd, DAY_MS } from "@/lib/datetime";
import { generateUnsubscribeToken } from "@/lib/email/unsubscribe-token";
import { notifyUser } from "@/lib/services/push-notifications";
import { getAppUrl } from "@/lib/utils/app-url";

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
};

function buildUnsubscribeLink(userId: string): string {
  const token = generateUnsubscribeToken(userId);
  return `${getAppUrl()}/unsubscribe?token=${token}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Purge
// ─────────────────────────────────────────────────────────────────────────────

async function purgeArchivedAnnouncements(service: SupabaseClient): Promise<number> {
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

async function purgeArchivedConversations(service: SupabaseClient): Promise<number> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * DAY_MS).toISOString();

  // Remove participant rows archived > 30 days (same effect as "permanently delete")
  const { data: removed, error: rmErr } = await service
    .from("conversation_participants")
    .delete()
    .not("archived_at", "is", null)
    .lt("archived_at", thirtyDaysAgo)
    .select("conversation_id");

  if (rmErr) throw new Error(`purgeArchivedConversations(participants): ${rmErr.message}`);

  const purgedCount = removed?.length ?? 0;
  if (purgedCount === 0) return 0;

  // Clean up orphan conversations (no participants left)
  const conversationIds = [...new Set(removed!.map((r) => r.conversation_id))];
  for (const convId of conversationIds) {
    const { count } = await service
      .from("conversation_participants")
      .select("*", { count: "exact", head: true })
      .eq("conversation_id", convId);

    if (count === 0) {
      await service.from("messages").delete().eq("conversation_id", convId);
      await service.from("conversations").delete().eq("id", convId);
    }
  }

  return purgedCount;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: check email opt-in preference
// ─────────────────────────────────────────────────────────────────────────────

async function isEmailLifecycleEnabled(service: SupabaseClient, userId: string): Promise<boolean> {
  const { data } = await service
    .from("user_notification_preferences")
    .select("email_lifecycle_enabled")
    .eq("user_id", userId)
    .maybeSingle();

  // Default true if no row exists
  return data?.email_lifecycle_enabled ?? true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Collect: invite reminders (3 days, no signup)
// ─────────────────────────────────────────────────────────────────────────────

async function collectInviteReminders(service: SupabaseClient): Promise<number> {
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
    .select("id, name")
    .in("id", [...new Set(invites.map((i) => i.commune_id))]);

  const communeMap = new Map((communes ?? []).map((c) => [c.id, c.name]));
  const membershipMap = new Map((memberships ?? []).map((m) => [m.id, m]));
  const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p.display_name]));

  const queueRows = invites.map((invite) => {
    const membership = membershipMap.get(invite.inviter_membership_id);
    const senderName = membership ? (profileMap.get(membership.user_id) ?? "Un voisin") : "Un voisin";
    const communeName = communeMap.get(invite.commune_id) ?? "";
    return {
      to_email: invite.email,
      template_slug: "invite-reminder",
      variables: {
        sender_name: senderName,
        commune_name: communeName,
        invite_link: `${appUrl}/inscription?token=${invite.token}`,
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
// Collect: engagement reminders (3-6 day old users with no content)
// ─────────────────────────────────────────────────────────────────────────────

async function collectEngagementReminders(service: SupabaseClient): Promise<number> {
  const sixDaysAgo = new Date(Date.now() - 6 * DAY_MS).toISOString();
  const threeDaysAgo = new Date(Date.now() - 3 * DAY_MS).toISOString();
  const appUrl = getAppUrl();

  const { data: profiles, error } = await service
    .from("profiles")
    .select("user_id, display_name, active_commune_id")
    .is("engagement_reminder_sent_at", null)
    .lt("created_at", threeDaysAgo)
    .gt("created_at", sixDaysAgo)
    .limit(200);

  if (error) throw new Error(`collectEngagementReminders: ${error.message}`);
  if (!profiles || profiles.length === 0) return 0;

  const userIds = profiles.map((p) => p.user_id);

  // Batch check: users who have created at least one content
  const { data: announcementAuthors } = await service
    .from("announcements")
    .select("author_membership_id")
    .limit(1000);
  const { data: initiativeAuthors } = await service
    .from("initiatives")
    .select("author_membership_id")
    .limit(1000);
  const { data: eventAuthors } = await service
    .from("events")
    .select("author_membership_id")
    .limit(1000);

  // Get memberships for our user pool
  const { data: memberships } = await service
    .from("memberships")
    .select("id, user_id")
    .in("user_id", userIds);

  const membershipIdsByUser = new Map<string, string[]>();
  for (const m of memberships ?? []) {
    const arr = membershipIdsByUser.get(m.user_id) ?? [];
    arr.push(m.id);
    membershipIdsByUser.set(m.user_id, arr);
  }

  const allContentMembershipIds = new Set([
    ...(announcementAuthors ?? []).map((a) => a.author_membership_id),
    ...(initiativeAuthors ?? []).map((a) => a.author_membership_id),
    ...(eventAuthors ?? []).map((a) => a.author_membership_id),
  ]);

  const eligible = profiles.filter((p) => {
    const mIds = membershipIdsByUser.get(p.user_id) ?? [];
    return !mIds.some((mId) => allContentMembershipIds.has(mId));
  });

  if (eligible.length === 0) return 0;

  // Get user emails
  const { data: users } = await service.auth.admin.listUsers();
  const emailMap = new Map(
    (users?.users ?? []).map((u) => [u.id, u.email]),
  );

  const communeIds = [...new Set(eligible.map((p) => p.active_commune_id).filter(Boolean))];
  const { data: communes } = await service
    .from("communes")
    .select("id, name")
    .in("id", communeIds as string[]);
  const communeMap = new Map((communes ?? []).map((c) => [c.id, c.name]));

  const queueRows: Array<Record<string, unknown>> = [];
  const notifiedUserIds: string[] = [];

  for (const profile of eligible) {
    const email = emailMap.get(profile.user_id);
    if (!email) continue;

    const emailEnabled = await isEmailLifecycleEnabled(service, profile.user_id);
    const communeName = communeMap.get(profile.active_commune_id ?? "") ?? "";

    if (emailEnabled) {
      queueRows.push({
        to_email: email,
        template_slug: "engagement-first-week",
        variables: {
          user_name: profile.display_name ?? "Voisin·e",
          commune_name: communeName,
          app_url: `${appUrl}${ROUTES.annonces.new()}`,
          unsubscribe_link: buildUnsubscribeLink(profile.user_id),
        },
      });
    }

    notifiedUserIds.push(profile.user_id);
    void notifyUser(profile.user_id, {
      title: "Publiez votre première annonce !",
      body: `Partagez un coup de main ou une offre avec vos voisins de ${communeName}`,
      url: ROUTES.annonces.new(),
      tag: "engagement-first-week",
    });
  }

  if (queueRows.length > 0) {
    await service.from("email_queue").insert(queueRows);
  }

  if (notifiedUserIds.length > 0) {
    await service
      .from("profiles")
      .update({ engagement_reminder_sent_at: new Date().toISOString() })
      .in("user_id", notifiedUserIds);
  }

  return notifiedUserIds.length;
}

// ─────────────────────────────────────────────────────────────────────────────
// Collect: announcement expired nudges (target_date + 2 days)
// ─────────────────────────────────────────────────────────────────────────────

async function collectAnnouncementExpiredNudges(service: SupabaseClient): Promise<number> {
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

  const { data: users } = await service.auth.admin.listUsers();
  const emailMap = new Map((users?.users ?? []).map((u) => [u.id, u.email]));

  const queueRows: Array<Record<string, unknown>> = [];
  const processedIds: string[] = [];

  for (const ann of eligible) {
    const userId = membershipUserMap.get(ann.author_membership_id);
    if (!userId) continue;

    const email = emailMap.get(userId);
    const userName = profileMap.get(userId) ?? "Voisin·e";
    const announcementUrl = `${appUrl}${ROUTES.annonces.detail(ann.id)}`;

    const emailEnabled = await isEmailLifecycleEnabled(service, userId);
    if (emailEnabled && email) {
      queueRows.push({
        to_email: email,
        template_slug: "announcement-expired-nudge",
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
    await service.from("email_queue").insert(queueRows);
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

async function collectAnnouncementStaleNudges(service: SupabaseClient): Promise<number> {
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

  const { data: users } = await service.auth.admin.listUsers();
  const emailMap = new Map((users?.users ?? []).map((u) => [u.id, u.email]));

  const queueRows: Array<Record<string, unknown>> = [];
  const processedIds: string[] = [];

  for (const ann of eligible) {
    const userId = membershipUserMap.get(ann.author_membership_id);
    if (!userId) continue;

    const email = emailMap.get(userId);
    const userName = profileMap.get(userId) ?? "Voisin·e";
    const announcementUrl = `${appUrl}${ROUTES.annonces.detail(ann.id)}`;

    const emailEnabled = await isEmailLifecycleEnabled(service, userId);
    if (emailEnabled && email) {
      queueRows.push({
        to_email: email,
        template_slug: "announcement-stale-60d",
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
    await service.from("email_queue").insert(queueRows);
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

async function collectInitiativeStaleNudges(service: SupabaseClient): Promise<number> {
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

  const { data: users } = await service.auth.admin.listUsers();
  const emailMap = new Map((users?.users ?? []).map((u) => [u.id, u.email]));

  const queueRows: Array<Record<string, unknown>> = [];
  const processedIds: string[] = [];

  for (const ini of eligible) {
    const userId = membershipUserMap.get(ini.author_membership_id);
    if (!userId) continue;

    const email = emailMap.get(userId);
    const userName = profileMap.get(userId) ?? "Voisin·e";
    const initiativeUrl = `${appUrl}${ROUTES.initiatives.detail(ini.id)}`;

    const emailEnabled = await isEmailLifecycleEnabled(service, userId);
    if (emailEnabled && email) {
      queueRows.push({
        to_email: email,
        template_slug: "initiative-stale-60d",
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
    await service.from("email_queue").insert(queueRows);
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

async function collectEventPastNudges(service: SupabaseClient): Promise<number> {
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

  const { data: users } = await service.auth.admin.listUsers();
  const emailMap = new Map((users?.users ?? []).map((u) => [u.id, u.email]));

  const queueRows: Array<Record<string, unknown>> = [];
  const processedIds: string[] = [];

  for (const evt of eligible) {
    const userId = membershipUserMap.get(evt.author_membership_id);
    if (!userId) continue;

    const email = emailMap.get(userId);
    const userName = profileMap.get(userId) ?? "Voisin·e";
    const eventUrl = `${appUrl}${ROUTES.evenements.detail(evt.id)}`;

    const emailEnabled = await isEmailLifecycleEnabled(service, userId);
    if (emailEnabled && email) {
      queueRows.push({
        to_email: email,
        template_slug: "event-past-nudge",
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
    await service.from("email_queue").insert(queueRows);
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

async function collectNotificationReminders(service: SupabaseClient): Promise<number> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS).toISOString();
  const oneDayAgo = new Date(now.getTime() - DAY_MS).toISOString();
  const appUrl = getAppUrl();

  const { data: profiles, error } = await service
    .from("profiles")
    .select("user_id, display_name, active_commune_id")
    .is("notification_prompt_email_sent_at", null)
    .lt("created_at", oneDayAgo)
    .gt("created_at", sevenDaysAgo)
    .limit(200);

  if (error) throw new Error(`collectNotificationReminders: ${error.message}`);
  if (!profiles || profiles.length === 0) return 0;

  const userIds = profiles.map((p) => p.user_id);

  // Users who already have push subscriptions
  const { data: pushSubs } = await service
    .from("push_subscriptions")
    .select("user_id")
    .in("user_id", userIds);
  const usersWithPush = new Set((pushSubs ?? []).map((s) => s.user_id));

  const eligible = profiles.filter((p) => !usersWithPush.has(p.user_id));
  if (eligible.length === 0) return 0;

  const { data: users } = await service.auth.admin.listUsers();
  const emailMap = new Map((users?.users ?? []).map((u) => [u.id, u.email]));

  const communeIds = [...new Set(eligible.map((p) => p.active_commune_id).filter(Boolean))];
  const { data: communes } = await service
    .from("communes")
    .select("id, name")
    .in("id", communeIds as string[]);
  const communeMap = new Map((communes ?? []).map((c) => [c.id, c.name]));

  const queueRows: Array<Record<string, unknown>> = [];
  const notifiedUserIds: string[] = [];

  for (const profile of eligible) {
    const email = emailMap.get(profile.user_id);
    if (!email) continue;

    const communeName = communeMap.get(profile.active_commune_id ?? "") ?? "";
    const emailEnabled = await isEmailLifecycleEnabled(service, profile.user_id);

    if (emailEnabled) {
      queueRows.push({
        to_email: email,
        template_slug: "notification-activation-reminder",
        variables: {
          user_name: profile.display_name ?? "Voisin·e",
          commune_name: communeName,
          unsubscribe_link: buildUnsubscribeLink(profile.user_id),
        },
      });
    }

    notifiedUserIds.push(profile.user_id);
    void notifyUser(profile.user_id, {
      title: "Activez les notifications",
      body: "Ne manquez pas les annonces et événements de votre commune !",
      url: `${ROUTES.profil}?tab=parametres`,
      tag: "notification-activation-reminder",
    });
  }

  if (queueRows.length > 0) {
    await service.from("email_queue").insert(queueRows);
  }
  if (notifiedUserIds.length > 0) {
    await service
      .from("profiles")
      .update({ notification_prompt_email_sent_at: now.toISOString() })
      .in("user_id", notifiedUserIds);
  }

  return notifiedUserIds.length;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main orchestrator
// ─────────────────────────────────────────────────────────────────────────────

export async function runLifecycleCollector(service: SupabaseClient): Promise<CollectorResult> {
  const purgedAnnouncements = await purgeArchivedAnnouncements(service);
  const purgedConversations = await purgeArchivedConversations(service);

  const invites = await collectInviteReminders(service);
  const engagement = await collectEngagementReminders(service);
  const announcementExpired = await collectAnnouncementExpiredNudges(service);
  const announcementStale = await collectAnnouncementStaleNudges(service);
  const initiativeStale = await collectInitiativeStaleNudges(service);
  const eventPast = await collectEventPastNudges(service);
  const notificationReminder = await collectNotificationReminders(service);

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
  };
}
