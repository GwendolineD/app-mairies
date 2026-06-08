import type { AnnouncementType } from "@/lib/constants/announcement-types";

export type UserRole = "resident" | "municipality_staff" | "platform_admin";
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
  subscription_status: SubscriptionStatus;
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

export type Profile = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  active_commune_id: string | null;
  role: UserRole;
};

export type Membership = {
  id: string;
  user_id: string;
  commune_id: string;
  address_label: string | null;
  address_citycode: string | null;
  address_postcode: string | null;
  address_lat: number | null;
  address_lng: number | null;
  is_primary: boolean;
  status: MembershipStatus;
  suspended_at: string | null;
  suspension_reason: string | null;
  commune?: Commune;
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
  address_lat: number | null;
  address_lng: number | null;
  created_at: string;
  author?: { display_name: string | null };
};

export type InitiativeRecord = {
  id: string;
  commune_id: string;
  author_membership_id: string;
  title: string;
  description: string | null;
  date_mode: "none" | "once" | "recurring";
  single_starts_at: string | null;
  single_ends_at: string | null;
  recurrence_rule: unknown;
  status: "active" | "archived";
  address_lat: number | null;
  address_lng: number | null;
  created_at: string;
  updated_at: string;
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
  address_lat: number | null;
  address_lng: number | null;
  created_at: string;
  updated_at: string;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  edited_at: string | null;
};

export type ConversationPreview = {
  id: string;
  title: string | null;
  updated_at: string;
};
