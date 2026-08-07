"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useTransition } from "react";
import {
  buildBackofficeContenusListQuery,
  loadContenusFiltersFromStorage,
  saveContenusFiltersToStorage,
  storedFiltersToPartialParams,
  type BackofficeContenusListParams,
  type BackofficeContenusTab,
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
    (newTab: BackofficeContenusTab) => {
      if (newTab === params.tab) return;

      if (params.tab !== "stats") {
        saveContenusFiltersToStorage(params.tab, params);
      }

      const stored =
        newTab === "stats" ? null : loadContenusFiltersFromStorage(newTab);
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
  const statusesKey = params.statuses.join(",");
  useEffect(() => {
    if (params.tab === "stats") return;
    saveContenusFiltersToStorage(params.tab, params);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- individual param fields listed; full params object is unstable
  }, [
    params.tab,
    params.q,
    params.commune,
    statusesKey,
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
