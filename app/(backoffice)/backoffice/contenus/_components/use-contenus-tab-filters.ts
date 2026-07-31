"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useTransition } from "react";
import {
  buildBackofficeContenusListQuery,
  loadContenusFiltersFromStorage,
  saveContenusFiltersToStorage,
  storedFiltersToPartialParams,
  type BackofficeContenusListParams,
  type BackofficeContentType,
} from "@/lib/utils/backoffice-contenus-params";

export function useContenusTabFilters(params: BackofficeContenusListParams) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const navigate = useCallback(
    (next: Partial<BackofficeContenusListParams>) => {
      const merged = { ...params, page: 1, ...next };
      saveContenusFiltersToStorage(merged.tab, merged);
      startTransition(() => {
        router.push(
          `${pathname}${buildBackofficeContenusListQuery(merged)}`,
        );
      });
    },
    [params, pathname, router],
  );

  const switchTab = useCallback(
    (newTab: BackofficeContentType) => {
      if (newTab === params.tab) return;

      saveContenusFiltersToStorage(params.tab, params);

      const stored = loadContenusFiltersFromStorage(newTab);
      const restored = storedFiltersToPartialParams(newTab, stored ?? {});

      startTransition(() => {
        router.push(
          `${pathname}${buildBackofficeContenusListQuery({
            tab: newTab,
            limit: params.limit,
            ...restored,
            page: 1,
          })}`,
        );
      });
    },
    [params, pathname, router],
  );

  // Sync current URL filters to localStorage when they change
  useEffect(() => {
    saveContenusFiltersToStorage(params.tab, params);
  }, [
    params.tab,
    params.q,
    params.commune,
    params.statuses.join(","),
    params.suspended,
    params.subtype,
    params.category,
    params.official,
    params.dateFrom,
    params.dateTo,
    params.sort,
  ]);

  return { navigate, switchTab, isPending };
}
