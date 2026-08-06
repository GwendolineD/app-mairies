export const LEADS_PAGE_SIZE = 20;
export const LEADS_PAGE_SIZES = [10, 20, 50] as const;

export type LeadsListParams = {
  page: number;
  limit: number;
};

export function parseLeadsListParams(
  searchParams: Record<string, string | string[] | undefined>,
): LeadsListParams {
  const pageRaw = Array.isArray(searchParams.page)
    ? searchParams.page[0]
    : searchParams.page;
  const page = Math.max(1, parseInt(pageRaw ?? "1", 10) || 1);

  const limitRaw = Array.isArray(searchParams.limit)
    ? searchParams.limit[0]
    : searchParams.limit;
  const parsedLimit = parseInt(limitRaw ?? String(LEADS_PAGE_SIZE), 10);
  const limit = LEADS_PAGE_SIZES.includes(
    parsedLimit as (typeof LEADS_PAGE_SIZES)[number],
  )
    ? parsedLimit
    : LEADS_PAGE_SIZE;

  return { page, limit };
}

export function buildLeadsListQuery(params: Partial<LeadsListParams>): string {
  const sp = new URLSearchParams();
  const page = params.page ?? 1;
  const limit = params.limit ?? LEADS_PAGE_SIZE;

  if (page > 1) {
    sp.set("page", String(page));
  }
  if (limit !== LEADS_PAGE_SIZE) {
    sp.set("limit", String(limit));
  }

  const query = sp.toString();
  return query ? `?${query}` : "";
}
