export type UserRole = "resident" | "municipality_staff" | "platform_admin";
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
  type: "demande" | "offre";
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

export function formatDisplayName(
  firstName: string,
  lastName: string,
): string {
  const initial = lastName.trim().charAt(0).toUpperCase();
  return `${firstName.trim()} ${initial}.`;
}
