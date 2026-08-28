"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useTransition } from "react";
import {
  buildBackofficeUtilisateursListQuery,
  type BackofficeUtilisateursListParams,
  type BackofficeUtilisateursTab,
} from "@/lib/utils/backoffice-utilisateurs-params";

export function useUtilisateursTabFilters(params: BackofficeUtilisateursListParams) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const navigate = useCallback(
    (next: Partial<BackofficeUtilisateursListParams>) => {
      startTransition(() => {
        router.push(
          `${pathname}${buildBackofficeUtilisateursListQuery({ ...params, page: 1, ...next })}`,
          { scroll: false },
        );
      });
    },
    [params, pathname, router],
  );

  const switchTab = useCallback(
    (tab: BackofficeUtilisateursTab) => {
      if (tab === params.tab) return;
      startTransition(() => {
        router.push(
          `${pathname}${buildBackofficeUtilisateursListQuery({
            tab,
            limit: params.limit,
            page: 1,
          })}`,
          { scroll: false },
        );
      });
    },
    [params.limit, params.tab, pathname, router],
  );

  return { navigate, switchTab, isPending };
}
