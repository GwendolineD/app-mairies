import type { SupabaseClient } from "@supabase/supabase-js";
import type { AnnouncementWithAuthor } from "@/lib/queries/announcements";
import {
  enrichInitiativesWithMeta,
  type InitiativeWithAuthor,
} from "@/lib/queries/initiatives";
import { unwrapOrThrow } from "@/lib/queries/helpers";
import {
  ANNOUNCEMENT_STATUS,
  EVENT_STATUS,
  INITIATIVE_STATUS,
} from "@/lib/constants/statuses";
import type { AgendaEventRecord } from "@/lib/types";
import { clampPage } from "@/lib/utils/profile-list-params";

export const PROFILE_CONTENT_PAGE_SIZE = 10;

export type AuthorProfileScope = {
  communeId: string;
  membershipId: string;
};

export type ProfileListResult<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
};

type PaginationOptions = {
  page: number;
  pageSize?: number;
};

function paginateRange(page: number, pageSize: number) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { from, to };
}

/**
 * Author "en cours" lists — includes suspended content (unlike public list queries).
 */
export async function listAuthorAnnouncementsPage(
  supabase: SupabaseClient,
  scope: AuthorProfileScope,
  options: PaginationOptions,
): Promise<ProfileListResult<AnnouncementWithAuthor>> {
  const pageSize = options.pageSize ?? PROFILE_CONTENT_PAGE_SIZE;

  const countResult = await supabase
    .from("announcements")
    .select("id", { count: "exact", head: true })
    .eq("commune_id", scope.communeId)
    .eq("author_membership_id", scope.membershipId)
    .neq("status", ANNOUNCEMENT_STATUS.archivee);

  if (countResult.error) {
    throw new Error(
      `[profile-author-announcements-count] ${countResult.error.message}`,
    );
  }

  const totalCount = countResult.count ?? 0;
  const page = clampPage(options.page, totalCount, pageSize);
  const { from, to } = paginateRange(page, pageSize);

  const result = await supabase
    .from("announcements")
    .select(
      "*, author_membership:memberships!announcements_author_membership_id_fkey(address_street, address_city, address_postcode, address_lat, address_lng, profiles:profiles!memberships_profiles_user_id_fkey(first_name, last_name, display_name, avatar_url))",
    )
    .eq("commune_id", scope.communeId)
    .eq("author_membership_id", scope.membershipId)
    .neq("status", ANNOUNCEMENT_STATUS.archivee)
    .order("created_at", { ascending: false })
    .range(from, to);

  const items = unwrapOrThrow(
    result,
    "profile-author-announcements",
  ) as AnnouncementWithAuthor[];

  return { items, totalCount, page, pageSize };
}

export async function listAuthorInitiativesPage(
  supabase: SupabaseClient,
  scope: AuthorProfileScope,
  options: PaginationOptions,
): Promise<ProfileListResult<InitiativeWithAuthor>> {
  const pageSize = options.pageSize ?? PROFILE_CONTENT_PAGE_SIZE;

  const countResult = await supabase
    .from("initiatives")
    .select("id", { count: "exact", head: true })
    .eq("commune_id", scope.communeId)
    .eq("author_membership_id", scope.membershipId)
    .eq("status", INITIATIVE_STATUS.active);

  if (countResult.error) {
    throw new Error(
      `[profile-author-initiatives-count] ${countResult.error.message}`,
    );
  }

  const totalCount = countResult.count ?? 0;
  const page = clampPage(options.page, totalCount, pageSize);
  const { from, to } = paginateRange(page, pageSize);

  const result = await supabase
    .from("initiatives")
    .select(
      "*, author_membership:memberships!initiatives_author_membership_id_fkey(address_street, address_city, profiles(first_name, last_name, display_name, avatar_url))",
    )
    .eq("commune_id", scope.communeId)
    .eq("author_membership_id", scope.membershipId)
    .eq("status", INITIATIVE_STATUS.active)
    .order("created_at", { ascending: false })
    .range(from, to);

  const items = unwrapOrThrow(
    result,
    "profile-author-initiatives",
  ) as InitiativeWithAuthor[];

  await enrichInitiativesWithMeta(supabase, items);

  return { items, totalCount, page, pageSize };
}

export async function listAuthorEventsPage(
  supabase: SupabaseClient,
  scope: AuthorProfileScope,
  options: PaginationOptions,
): Promise<ProfileListResult<AgendaEventRecord>> {
  const pageSize = options.pageSize ?? PROFILE_CONTENT_PAGE_SIZE;

  const countResult = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("commune_id", scope.communeId)
    .eq("author_membership_id", scope.membershipId)
    .eq("status", EVENT_STATUS.active)
    .eq("is_official", false);

  if (countResult.error) {
    throw new Error(
      `[profile-author-events-count] ${countResult.error.message}`,
    );
  }

  const totalCount = countResult.count ?? 0;
  const page = clampPage(options.page, totalCount, pageSize);
  const { from, to } = paginateRange(page, pageSize);

  const result = await supabase
    .from("events")
    .select("*")
    .eq("commune_id", scope.communeId)
    .eq("author_membership_id", scope.membershipId)
    .eq("status", EVENT_STATUS.active)
    .eq("is_official", false)
    .order("created_at", { ascending: false })
    .range(from, to);

  const items = unwrapOrThrow(result, "profile-author-events") as AgendaEventRecord[];

  return { items, totalCount, page, pageSize };
}
