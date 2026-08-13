"use client";

import type { ProspectCommuneDetail } from "@/lib/prospect-communes/types";
import type { ProspectCommunesListParams } from "@/lib/prospect-communes/filter-params";
import { ProspectionDetailSheet } from "./prospection-detail-sheet";
import { ProspectionList } from "./prospection-list";
import { ProspectionMapLazy } from "./prospection-map-lazy";
import { ProspectionToolbar } from "./prospection-toolbar";

type Props = {
  params: ProspectCommunesListParams;
  items: import("@/lib/prospect-communes/types").ProspectCommuneListItem[];
  totalCount: number;
  truncated: boolean;
  withoutCoordinatesCount: number;
  detail: ProspectCommuneDetail | null;
};

export function ProspectionView({
  params,
  items,
  totalCount,
  truncated,
  withoutCoordinatesCount,
  detail,
}: Props) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <ProspectionToolbar
        params={params}
        totalCount={totalCount}
        truncated={truncated}
      />

      {params.view === "map" ? (
        <ProspectionMapLazy
          params={params}
          items={items}
          withoutCoordinatesCount={withoutCoordinatesCount}
        />
      ) : (
        <ProspectionList params={params} items={items} />
      )}

      {detail ? (
        <ProspectionDetailSheet detail={detail} params={params} />
      ) : null}
    </div>
  );
}
