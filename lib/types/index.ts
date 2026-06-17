import type { AnnouncementType } from "@/lib/constants/announcement-types";

export type UserRole = "resident" | "municipality_staff" | "platform_admin";
export type MembershipRole = "member" | "staff" | "mayor";
export type AccessStatus = "inactive" | "trial" | "active";
export type SubscriptionStatus =
  | "inactive"
  | "trial"
  | "active"
  | "suspended";
export type MembershipStatus = "active" | "suspended" | "left";
export type CommunePlan = "free" | "standard" | "premium";
export type PaymentStatus = "paid" | "pending" | "failed" | "refunded";

export type Commune = {
  id: string;
  insee_code: string;
  name: string;
  postcode: string | null;
  department: string | null;
  centroid_lat: number | null;
  centroid_lng: number | null;
  access_status: AccessStatus;
  subscription_status: SubscriptionStatus;
  subscription_started_at: string | null;
  subscription_ends_at: string | null;
  subscription_paid: boolean;
  subscribed_since: string | null;
  plan: CommunePlan;
  monthly_amount_cents: number;
  billing_email: string | null;
  suspended_at: string | null;
  suspension_reason: string | null;
  created_at?: string;
  updated_at?: string;
  settings: CommuneSettings;
};

export type CommunePayment = {
  id: string;
  commune_id: string;
  amount_cents: number;
  currency: string;
  status: PaymentStatus;
  period_start: string | null;
  period_end: string | null;
  paid_at: string | null;
  note: string | null;
  created_at: string;
};

/** Row returned by the admin_commune_overview() RPC. */
export type CommuneOverviewRow = {
  id: string;
  insee_code: string;
  name: string;
  postcode: string | null;
  department: string | null;
  subscription_status: SubscriptionStatus;
  plan: CommunePlan;
  monthly_amount_cents: number;
  billing_email: string | null;
  suspended_at: string | null;
  resident_count: number;
  announcement_count: number;
  initiative_count: number;
  event_count: number;
  paid_revenue_cents: number;
  pending_revenue_cents: number;
  last_payment_at: string | null;
  created_at: string;
};

/** Row returned by the admin_commune_users() RPC. */
export type CommuneUserRow = {
  user_id: string;
  email: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  role: UserRole;
  membership_id: string;
  membership_status: MembershipStatus;
  is_banned: boolean;
  address_label: string | null;
  announcement_count: number;
  joined_at: string;
};

/** Aggregated KPIs returned by the admin_platform_stats() RPC. */
export type PlatformStats = {
  communes_total: number;
  communes_active: number;
  communes_trial: number;
  communes_suspended: number;
  communes_inactive: number;
  residents_total: number;
  announcements_total: number;
  initiatives_total: number;
  events_total: number;
  mrr_cents: number;
  revenue_paid_cents: number;
  revenue_pending_cents: number;
  payments_paid_count: number;
  revenue_last_30d_cents: number;
};

export type CommuneSettings = {
  address?: string;
  phone?: string;
  referentName?: string;
  referentRole?: string;
  openingHours?: string;
  welcomeMessage?: string;
};

export type CommuneEmailTemplate = {
  id: string;
  commune_id: string;
  template_key: "neighbor_invite";
  subject: string;
  preheader: string | null;
  body_markdown: string;
  cta_label: string;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  active_commune_id: string | null;
  role: UserRole;
  is_platform_admin: boolean;
  created_at: string;
  updated_at: string;
};

export type Membership = {
  id: string;
  user_id: string;
  commune_id: string;
  role: MembershipRole;
  address_street: string | null;
  address_lieu_dit: string | null;
  address_city: string | null;
  address_citycode: string | null;
  address_postcode: string | null;
  address_lat: number | null;
  address_lng: number | null;
  is_primary: boolean;
  status: MembershipStatus;
  suspended_at: string | null;
  suspension_reason: string | null;
  total_announcements_published: number;
  total_initiatives_published: number;
  total_events_published: number;
  created_at: string;
  updated_at: string;
  commune?: Commune;
};

export type MembershipAddress = {
  street: string | null;
  city: string | null;
  citycode: string | null;
  postcode: string | null;
  lat: number | null;
  lng: number | null;
};

export function membershipToAddress(membership: Membership): MembershipAddress {
  return {
    street: membership.address_street,
    city: membership.address_city,
    citycode: membership.address_citycode,
    postcode: membership.address_postcode,
    lat: membership.address_lat,
    lng: membership.address_lng,
  };
}

export type ProfileNotificationPreferences = {
  user_id: string;
  message_notifications_enabled: boolean;
  announcement_notifications_enabled: boolean;
  initiative_notifications_enabled: boolean;
  updated_at: string;
};

export type Announcement = {
  id: string;
  commune_id: string;
  author_membership_id: string;
  type: AnnouncementType;
  category_slug: string;
  title: string;
  description: string | null;
  photo_url: string | null;
  target_date: string | null;
  status: "ouverte" | "pourvue" | "archivee" | "expiree";
  address_street: string | null;
  address_city: string | null;
  address_citycode: string | null;
  address_postcode: string | null;
  address_lat: number | null;
  address_lng: number | null;
  created_at: string;
  author?: { display_name: string | null };
};

export type AnnouncementEditData = {
  type: AnnouncementType;
  categorySlug: string;
  title: string;
  description: string;
  targetDate: string;
  photoUrl: string;
  addressStreet: string;
  addressCity: string;
  addressCitycode: string;
  addressPostcode: string;
  addressLat: number;
  addressLng: number;
};

export type InitiativeRecord = {
  id: string;
  commune_id: string;
  author_membership_id: string;
  category_slug: string;
  title: string;
  description: string | null;
  date_mode: "none" | "once" | "recurring";
  single_starts_at: string | null;
  single_ends_at: string | null;
  recurrence_rule: unknown;
  status: "active" | "archived";
  photo_url: string | null;
  location_label: string | null;
  address_lat: number | null;
  address_lng: number | null;
  created_at: string;
  updated_at: string;
};

/** Author identity resolved for an initiative detail view. */
export type InitiativeAuthor = {
  membershipId: string;
  displayName: string | null;
  avatarUrl: string | null;
};

/** Participation snapshot for the current viewer on an initiative. */
export type InitiativeParticipation = {
  count: number;
  isParticipating: boolean;
};

export type AgendaEventRecord = {
  id: string;
  commune_id: string;
  author_membership_id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  status: "active" | "archived";
  photo_url: string | null;
  address_label: string | null;
  address_lat: number | null;
  address_lng: number | null;
  created_at: string;
  updated_at: string;
};

export type ContextType = "announcement" | "initiative" | "event";
export type ConversationContextType = "announcement" | "initiative" | "event";

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  edited_at: string | null;
};

export type ConversationRow = {
  id: string;
  commune_id: string;
  created_by_user_id: string;
  context_type: ConversationContextType | null;
  context_id: string | null;
  title: string | null;
  participant_a: string | null;
  participant_b: string | null;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  last_message_sender_id: string | null;
};

/** Returned by the `list_my_conversations` RPC — one row per conversation for the current user. */
export type ConversationInboxItem = {
  conversation_id: string;
  context_type: ConversationContextType | null;
  context_id: string | null;
  title: string | null;
  updated_at: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  last_message_sender_id: string | null;
  archived_at: string | null;
  last_read_at: string | null;
  other_user_id: string | null;
  other_display_name: string | null;
  other_avatar_url: string | null;
  unread_count: number;
};

/** Lightweight profile slice used to render participants in the messaging UI. */
export type ParticipantProfile = {
  user_id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

/** A conversation row enriched for the inbox list view. */
export type ConversationListEntry = {
  id: string;
  title: string | null;
  context_type: ContextType | null;
  context_id: string | null;
  updated_at: string;
  otherParticipant: ParticipantProfile | null;
  lastMessage: {
    body: string;
    created_at: string;
    sender_id: string;
  } | null;
  unreadCount: number;
};

/** A message enriched with its sender profile for the thread view. */
export type ThreadMessage = MessageRow & {
  sender: ParticipantProfile | null;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  title: string | null;
  body: string | null;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

export type NotificationPreferenceKey =
  | "notify_message_announcement"
  | "notify_message_initiative"
  | "notify_message_event"
  | "notify_new_announcement"
  | "notify_new_initiative"
  | "notify_new_event";

export type NotificationPreferences = Record<NotificationPreferenceKey, boolean>;

export interface AnnouncementCategoryRow {
  slug: string;
  label: string;
  sort_order: number;
  icon_name: string | null;
  color_hex: string;
  map_pin_url: string | null;
  default_image_url: string | null;
}
