import type { SupabaseClient } from "@supabase/supabase-js";
import { getCategoryLabel } from "@/lib/constants/announcement-categories";
import { getInitiativeCategoryLabel } from "@/lib/constants/initiative-categories";
import { ROUTES } from "@/lib/constants/routes";
import {
  ANNOUNCEMENT_STATUS,
  INITIATIVE_STATUS,
} from "@/lib/constants/statuses";
import type {
  BackofficeContenusListParams,
  BackofficeContentStatus,
  BackofficeContentType,
} from "@/lib/utils/backoffice-contenus-params";
import { statusesForContentType } from "@/lib/utils/backoffice-contenus-params";

export type ContentTypeCounts = Record<BackofficeContentType, number>;

export type ContentListRow = {
  id: string;
  contentType: BackofficeContentType;
  title: string;
  communeId: string;
  communeName: string;
  status: string;
  categorySlug: string | null;
  categoryLabel: string;
  subtype: string | null;
  authorName: string;
  authorUserId: string | null;
  isOfficial: boolean;
  suspended: boolean;
  createdAt: string;
  href: string;
};

type AuthorProfile = {
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
};

type AuthorMembership = {
  user_id: string;
  profile: AuthorProfile | AuthorProfile[] | null;
};

type CommuneRef = {
  id: string;
  name: string;
};

type ContentBaseRow = {
  id: string;
  title: string;
  commune_id: string;
  status: string;
  category_slug: string | null;
  created_at: string;
  suspended_at: string | null;
  commune: CommuneRef | CommuneRef[] | null;
  author: AuthorMembership | AuthorMembership[] | null;
};

type AnnouncementRow = ContentBaseRow & {
  type: string;
};

type EventRow = ContentBaseRow & {
  is_official: boolean;
};

function resolveOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function formatAuthorName(profile: AuthorProfile | null): string {
  if (!profile) return "Utilisateur·rice";
  const parts = [profile.first_name, profile.last_name].filter(Boolean);
  if (parts.length > 0) return parts.join(" ");
  return profile.display_name?.trim() || "Utilisateur·rice";
}

function applyDateRange<T extends { gte: Function; lte: Function }>(
  query: T,
  dateFrom?: string,
  dateTo?: string,
): T {
  let next = query;
  if (dateFrom) {
    next = next.gte("created_at", `${dateFrom}T00:00:00.000Z`) as T;
  }
  if (dateTo) {
    next = next.lte("created_at", `${dateTo}T23:59:59.999Z`) as T;
  }
  return next;
}

function contentHref(type: BackofficeContentType, id: string): string {
  if (type === "announcement") return ROUTES.annonces.detail(id);
  if (type === "initiative") return ROUTES.initiatives.detail(id);
  return ROUTES.evenements.detail(id);
}

function categoryLabelForRow(
  type: BackofficeContentType,
  categorySlug: string | null,
): string {
  if (!categorySlug) return "—";
  if (type === "announcement") return getCategoryLabel(categorySlug);
  return getInitiativeCategoryLabel(categorySlug);
}

function mapContentRow(
  type: BackofficeContentType,
  row: ContentBaseRow & { type?: string; is_official?: boolean },
): ContentListRow {
  const commune = resolveOne(row.commune);
  const author = resolveOne(row.author);
  const profile = resolveOne(author?.profile ?? null);

  return {
    id: row.id,
    contentType: type,
    title: row.title,
    communeId: row.commune_id,
    communeName: commune?.name ?? "Commune inconnue",
    status: row.status,
    categorySlug: row.category_slug,
    categoryLabel: categoryLabelForRow(type, row.category_slug),
    subtype: type === "announcement" ? (row.type ?? null) : null,
    authorName: formatAuthorName(profile),
    authorUserId: author?.user_id ?? null,
    isOfficial: type === "event" ? Boolean(row.is_official) : false,
    suspended: row.suspended_at !== null,
    createdAt: row.created_at,
    href: contentHref(type, row.id),
  };
}

type SharedFilters = Pick<
  BackofficeContenusListParams,
  | "q"
  | "commune"
  | "statuses"
  | "suspended"
  | "category"
  | "dateFrom"
  | "dateTo"
  | "sort"
>;

function applySharedFilters<T extends {
  eq: Function;
  ilike: Function;
  in: Function;
  not: Function;
  is: Function;
  gte: Function;
  lte: Function;
}>(
  query: T,
  params: SharedFilters,
  statuses: BackofficeContentStatus[],
): T | null {
  if (statuses.length === 0) return null;

  let next = query.in("status", statuses) as T;

  if (params.q) {
    next = next.ilike("title", `%${params.q}%`) as T;
  }

  if (params.commune) {
    next = next.eq("commune_id", params.commune) as T;
  }

  if (params.suspended === true) {
    next = next.not("suspended_at", "is", null) as T;
  } else if (params.suspended === false) {
    next = next.is("suspended_at", null) as T;
  }

  if (params.category) {
    next = next.eq("category_slug", params.category) as T;
  }

  next = applyDateRange(next, params.dateFrom, params.dateTo);
  return next;
}

const AUTHOR_SELECT = `
  author:memberships!announcements_author_membership_id_fkey(
    user_id,
    profile:profiles!memberships_profiles_user_id_fkey(first_name, last_name, display_name)
  )
`;

const INITIATIVE_AUTHOR_SELECT = `
  author:memberships!initiatives_author_membership_id_fkey(
    user_id,
    profile:profiles!memberships_profiles_user_id_fkey(first_name, last_name, display_name)
  )
`;

const EVENT_AUTHOR_SELECT = `
  author:memberships!events_author_membership_id_fkey(
    user_id,
    profile:profiles!memberships_profiles_user_id_fkey(first_name, last_name, display_name)
  )
`;

async function countAnnouncements(
  supabase: SupabaseClient,
  params: BackofficeContenusListParams,
): Promise<number> {
  const statuses = statusesForContentType("announcement", params.statuses);
  let query = supabase
    .from("announcements")
    .select("id", { count: "exact", head: true });

  const filtered = applySharedFilters(query, params, statuses);
  if (!filtered) return 0;
  query = filtered;

  if (params.subtype) {
    query = query.eq("type", params.subtype);
  }

  const { count } = await query;
  return count ?? 0;
}

async function countInitiatives(
  supabase: SupabaseClient,
  params: BackofficeContenusListParams,
): Promise<number> {
  const statuses = statusesForContentType("initiative", params.statuses);
  let query = supabase
    .from("initiatives")
    .select("id", { count: "exact", head: true });

  const filtered = applySharedFilters(query, params, statuses);
  if (!filtered) return 0;

  const { count } = await filtered;
  return count ?? 0;
}

async function countEvents(
  supabase: SupabaseClient,
  params: BackofficeContenusListParams,
): Promise<number> {
  const statuses = statusesForContentType("event", params.statuses);
  let query = supabase
    .from("events")
    .select("id", { count: "exact", head: true });

  const filtered = applySharedFilters(query, params, statuses);
  if (!filtered) return 0;
  query = filtered;

  if (params.official === true) {
    query = query.eq("is_official", true);
  } else if (params.official === false) {
    query = query.eq("is_official", false);
  }

  const { count } = await query;
  return count ?? 0;
}

async function fetchAnnouncements(
  supabase: SupabaseClient,
  params: BackofficeContenusListParams,
  options?: { offset?: number; limit?: number },
): Promise<ContentListRow[]> {
  const statuses = statusesForContentType("announcement", params.statuses);
  const ascending = params.sort === "oldest";

  let query = supabase
    .from("announcements")
    .select(
      `
        id,
        title,
        commune_id,
        status,
        category_slug,
        type,
        created_at,
        suspended_at,
        commune:communes!announcements_commune_id_fkey(id, name),
        ${AUTHOR_SELECT}
      `,
    )
    .order("created_at", { ascending });

  const filtered = applySharedFilters(query, params, statuses);
  if (!filtered) return [];

  query = filtered;

  if (params.subtype) {
    query = query.eq("type", params.subtype);
  }

  if (options?.offset !== undefined && options.limit !== undefined) {
    query = query.range(options.offset, options.offset + options.limit - 1);
  } else if (options?.limit !== undefined) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) return [];

  return ((data ?? []) as AnnouncementRow[]).map((row) =>
    mapContentRow("announcement", row),
  );
}

async function fetchInitiatives(
  supabase: SupabaseClient,
  params: BackofficeContenusListParams,
  options?: { offset?: number; limit?: number },
): Promise<ContentListRow[]> {
  const statuses = statusesForContentType("initiative", params.statuses);
  const ascending = params.sort === "oldest";

  let query = supabase
    .from("initiatives")
    .select(
      `
        id,
        title,
        commune_id,
        status,
        category_slug,
        created_at,
        suspended_at,
        commune:communes!initiatives_commune_id_fkey(id, name),
        ${INITIATIVE_AUTHOR_SELECT}
      `,
    )
    .order("created_at", { ascending });

  const filtered = applySharedFilters(query, params, statuses);
  if (!filtered) return [];

  query = filtered;

  if (options?.offset !== undefined && options.limit !== undefined) {
    query = query.range(options.offset, options.offset + options.limit - 1);
  } else if (options?.limit !== undefined) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) return [];

  return ((data ?? []) as ContentBaseRow[]).map((row) =>
    mapContentRow("initiative", row),
  );
}

async function fetchEvents(
  supabase: SupabaseClient,
  params: BackofficeContenusListParams,
  options?: { offset?: number; limit?: number },
): Promise<ContentListRow[]> {
  const statuses = statusesForContentType("event", params.statuses);
  const ascending = params.sort === "oldest";

  let query = supabase
    .from("events")
    .select(
      `
        id,
        title,
        commune_id,
        status,
        category_slug,
        is_official,
        created_at,
        suspended_at,
        commune:communes!events_commune_id_fkey(id, name),
        ${EVENT_AUTHOR_SELECT}
      `,
    )
    .order("created_at", { ascending });

  const filtered = applySharedFilters(query, params, statuses);
  if (!filtered) return [];

  query = filtered;

  if (params.official === true) {
    query = query.eq("is_official", true);
  } else if (params.official === false) {
    query = query.eq("is_official", false);
  }

  if (options?.offset !== undefined && options.limit !== undefined) {
    query = query.range(options.offset, options.offset + options.limit - 1);
  } else if (options?.limit !== undefined) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) return [];

  return ((data ?? []) as EventRow[]).map((row) => mapContentRow("event", row));
}

async function listSingleTypePage(
  supabase: SupabaseClient,
  params: BackofficeContenusListParams,
  type: BackofficeContentType,
): Promise<{ items: ContentListRow[]; totalCount: number }> {
  const offset = (params.page - 1) * params.limit;

  const totalCount =
    type === "announcement"
      ? await countAnnouncements(supabase, params)
      : type === "initiative"
        ? await countInitiatives(supabase, params)
        : await countEvents(supabase, params);

  const items =
    type === "announcement"
      ? await fetchAnnouncements(supabase, params, {
          offset,
          limit: params.limit,
        })
      : type === "initiative"
        ? await fetchInitiatives(supabase, params, {
            offset,
            limit: params.limit,
          })
        : await fetchEvents(supabase, params, {
            offset,
            limit: params.limit,
          });

  return { items, totalCount };
}

export async function countAllContentTypes(
  supabase: SupabaseClient,
): Promise<ContentTypeCounts> {
  const [announcements, initiatives, events] = await Promise.all([
    supabase.from("announcements").select("id", { count: "exact", head: true }),
    supabase.from("initiatives").select("id", { count: "exact", head: true }),
    supabase.from("events").select("id", { count: "exact", head: true }),
  ]);

  return {
    announcement: announcements.count ?? 0,
    initiative: initiatives.count ?? 0,
    event: events.count ?? 0,
  };
}

export async function listContenusPage(
  supabase: SupabaseClient,
  params: BackofficeContenusListParams,
): Promise<{ items: ContentListRow[]; totalCount: number }> {
  return listSingleTypePage(supabase, params, params.tab);
}

export type ContentCategoryOption = {
  slug: string;
  label: string;
  contentType: BackofficeContentType;
};

export async function listContentCategoryOptions(
  supabase: SupabaseClient,
  types: BackofficeContentType[],
): Promise<ContentCategoryOption[]> {
  const options: ContentCategoryOption[] = [];

  if (types.includes("announcement")) {
    const { data } = await supabase
      .from("announcement_categories")
      .select("slug, label")
      .order("label");

    for (const row of data ?? []) {
      options.push({
        slug: row.slug,
        label: row.label,
        contentType: "announcement",
      });
    }
  }

  if (types.includes("initiative") || types.includes("event")) {
    const { data } = await supabase
      .from("initiative_event_categories")
      .select("slug, label")
      .order("label");

    for (const row of data ?? []) {
      if (types.includes("initiative")) {
        options.push({
          slug: row.slug,
          label: row.label,
          contentType: "initiative",
        });
      }
      if (types.includes("event")) {
        options.push({
          slug: row.slug,
          label: row.label,
          contentType: "event",
        });
      }
    }
  }

  const seen = new Set<string>();
  return options
    .filter((option) => {
      const key = `${option.contentType}:${option.slug}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.label.localeCompare(b.label, "fr"));
}

export {
  ANNOUNCEMENT_STATUS,
  INITIATIVE_STATUS,
};
