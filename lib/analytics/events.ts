export const ANALYTICS_EVENTS = [
  "page_view",
  "signup_completed",
  "commune_interest_submitted",
  "announcement_created",
  "announcement_status_changed",
  "initiative_created",
  "initiative_response",
  "event_created",
  "message_sent",
  "quick_action_tapped",
  "commune_switched",
  "neighbor_invite_sent",
  "content_reported",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];
