import "server-only";
import { cache } from "react";
import { ANNOUNCEMENT_STATUS } from "@/lib/constants/statuses";
import { createClient } from "@/lib/supabase/server";
import type { Announcement } from "@/lib/types";

/** Announcement row plus the embedded author membership (FK author_membership_id → memberships.id). */
export type AnnouncementWithMembership = Announcement & {
  author_membership: {
    id: string;
    user_id: string;
    created_at: string;
    address_label: string | null;
  } | null;
};

export type AnnouncementAuthor = {
  displayName: string | null;
  avatarUrl: string | null;
};

/**
 * Fetch a single announcement scoped to the active commune.
 * Wrapped in React.cache so sibling streamed sections (main, contact, location)
 * dedupe to a single query within the same request.
 */
export const getAnnouncement = cache(
  async (
    id: string,
    communeId: string,
  ): Promise<AnnouncementWithMembership | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("announcements")
      .select(
        "*, author_membership:memberships!author_membership_id(id, user_id, created_at, address_label)",
      )
      .eq("id", id)
      .eq("commune_id", communeId)
      .maybeSingle();

    if (error || !data) return null;
    return data as AnnouncementWithMembership;
  },
);

/**
 * Resolve the author's public profile from their auth user id.
 * Allowed by the `profiles_select` RLS policy when both users share an active commune.
 */
export const getAnnouncementAuthor = cache(
  async (userId: string): Promise<AnnouncementAuthor | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) return null;
    return {
      displayName: data.display_name,
      avatarUrl: data.avatar_url,
    };
  },
);

/**
 * Related announcements: same commune + same category, excluding the current one.
 * Only surfaces still-reachable items (ouverte / pourvue), newest first, capped at `limit`.
 */
export const getSimilarAnnouncements = cache(
  async (args: {
    communeId: string;
    categorySlug: string;
    excludeId: string;
    limit?: number;
  }): Promise<Announcement[]> => {
    const { communeId, categorySlug, excludeId, limit = 3 } = args;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("announcements")
      .select("id, type, category_slug, title, status, created_at, photo_url")
      .eq("commune_id", communeId)
      .eq("category_slug", categorySlug)
      .neq("id", excludeId)
      .in("status", [ANNOUNCEMENT_STATUS.ouverte, ANNOUNCEMENT_STATUS.pourvue])
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data as Announcement[];
  },
);
