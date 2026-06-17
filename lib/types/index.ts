import type { AnnouncementType } from "@/lib/constants/announcement-types";

export type MembershipRole = "member" | "staff" | "mayor";
export type AccessStatus = "inactive" | "trial" | "active";
export type MembershipStatus = "active" | "suspended" | "left";

export type Commune = {
  id: string;
  insee_code: string;
  name: string;
  postcode: string | null;
  department: string | null;
  centroid_lat: number | null;
  centroid_lng: number | null;
  access_status: AccessStatus;
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
  has_seen_onboarding: boolean;
};

export type ParticipantProfile = Pick<
  Profile,
  "display_name" | "first_name" | "last_name" | "avatar_url"
>;

export type Membership = {
  id: string;
  user_id: string;
  commune_id: string;
  address_street: string | null;
  address_lieu_dit: string | null;
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

export type InitiativeEditData = {
  categorySlug: string;
  title: string;
  description: string;
  photoUrl: string;
  addressStreet: string;
  addressCity: string;
  addressCitycode: string;
  addressPostcode: string;
  addressLat: number;
  addressLng: number;
};

export type EventEditData = {
  categorySlug: string;
  title: string;
  description: string;
  photoUrl: string;
  startsAt: string;
  endsAt: string;
  volunteersNeeded: number | null;
  addressStreet: string;
  addressCity: string;
  addressCitycode: string;
  addressPostcode: string;
  addressLat: number;
  addressLng: number;
  sourceInitiativeId?: string;
};

export type InitiativeRecord = {
  id: string;
  commune_id: string;
  author_membership_id: string;
  category_slug: string | null;
  title: string;
  description: string | null;
  photo_url: string | null;
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
  category_slug: string | null;
  source_initiative_id: string | null;
  volunteers_needed: number | null;
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
  context_photo_url: string | null;
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

export interface InitiativeEventCategoryRow {
  slug: string;
  label: string;
  sort_order: number;
  icon_name: string | null;
  color_hex: string;
  map_pin_url: string | null;
  default_image_url: string | null;
}
