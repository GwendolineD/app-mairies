import type { AnnouncementType } from "@/lib/constants/announcement-types";

export type MembershipRole = "member" | "staff" | "mayor";
export type SubscriptionStatus = "inactive" | "trial" | "active";
export type MembershipStatus = "active" | "suspended" | "left";

export type Commune = {
  id: string;
  insee_code: string;
  name: string;
  postcode: string | null;
  department: string | null;
  centroid_lat: number | null;
  centroid_lng: number | null;
  subscription_status: SubscriptionStatus;
  settings: CommuneSettings;
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
  bio: string | null;
  avatar_url: string | null;
  active_commune_id: string | null;
  is_platform_admin: boolean;
};

export type Membership = {
  id: string;
  user_id: string;
  commune_id: string;
  address_street: string | null;
  address_city: string | null;
  address_citycode: string | null;
  address_postcode: string | null;
  address_lat: number | null;
  address_lng: number | null;
  role: MembershipRole;
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
  category_slug: string | null;
  title: string;
  description: string | null;
  date_mode: "none" | "once" | "recurring";
  single_starts_at: string | null;
  single_ends_at: string | null;
  recurrence_rule: unknown;
  status: "active" | "archived";
  address_label: string | null;
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
  address_label: string | null;
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
