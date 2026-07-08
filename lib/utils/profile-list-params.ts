import {
  isProfileTab,
  type ProfileTabKey,
} from "@/components/features/profile/profile-tabs";
import { ROUTES } from "@/lib/constants/routes";

export type ProfileListParams = {
  tab: ProfileTabKey;
  page: number;
};

export function parseProfileListParams(
  sp: Record<string, string | string[] | undefined>,
): ProfileListParams {
  const rawTab = typeof sp.tab === "string" ? sp.tab : "";
  const tab: ProfileTabKey = isProfileTab(rawTab) ? rawTab : "annonces";

  const rawPage = typeof sp.page === "string" ? sp.page : "1";
  const parsed = Number.parseInt(rawPage, 10);
  const page = Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;

  return { tab, page };
}

export function clampPage(
  page: number,
  totalCount: number,
  pageSize: number,
): number {
  if (totalCount <= 0) return 1;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  return Math.min(Math.max(1, page), totalPages);
}

export function buildProfileListQuery({
  tab,
  page,
}: {
  tab: ProfileTabKey;
  page?: number;
}): string {
  const params = new URLSearchParams();
  if (tab !== "annonces") {
    params.set("tab", tab);
  }
  if (page && page > 1) {
    params.set("page", String(page));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function profileListHref(params: ProfileListParams): string {
  return `${ROUTES.profil}${buildProfileListQuery(params)}`;
}
