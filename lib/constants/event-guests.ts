/**
 * Event engagement with anonymous companions.
 *
 * A member registers to an event as a participant or a volunteer and may
 * declare N people coming along (no account, no name). The count lives on the
 * member's own registration row (`guests_count`).
 *
 * `MAX_EVENT_GUESTS` is mirrored by the SQL CHECK constraint
 * (`20261009210000_event_engagement_guests.sql`) and by the Zod schema.
 */

export const MAX_EVENT_GUESTS = 10;

export const EVENT_ENGAGEMENT_KINDS = ["participant", "volunteer"] as const;
export type EventEngagementKind = (typeof EVENT_ENGAGEMENT_KINDS)[number];

type EngagementKindConfig = {
  table: "event_participants" | "event_volunteers";
  prefKey: "notify_event_participation" | "notify_event_volunteer";
  /** Push tag prefix; final tag = `${tagPrefix}:${eventId}:${membershipId}`. */
  tagPrefix: string;
  engagementType: "event_participation" | "event_volunteer";
  /** Push title prefix shown to the event author. */
  notificationTitle: string;
};

export const EVENT_ENGAGEMENT_CONFIG: Record<EventEngagementKind, EngagementKindConfig> = {
  participant: {
    table: "event_participants",
    prefKey: "notify_event_participation",
    tagPrefix: "event-participation",
    engagementType: "event_participation",
    notificationTitle: "Nouvelle participation",
  },
  volunteer: {
    table: "event_volunteers",
    prefKey: "notify_event_volunteer",
    tagPrefix: "event-volunteer",
    engagementType: "event_volunteer",
    notificationTitle: "Nouveau·elle bénévole",
  },
};
