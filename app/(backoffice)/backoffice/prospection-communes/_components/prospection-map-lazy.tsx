"use client";

import dynamic from "next/dynamic";
import type { ProspectCommuneListItem } from "@/lib/prospect-communes/types";
import type { ProspectCommunesListParams } from "@/lib/prospect-communes/filter-params";

const ProspectionMap = dynamic(
  () =>
    import("./prospection-map").then((module) => module.ProspectionMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[420px] flex-1 items-center justify-center rounded-xl border border-border bg-warm text-sm font-medium text-muted">
        Chargement de la carte…
      </div>
    ),
  },
);

type Props = {
  params: ProspectCommunesListParams;
  items: ProspectCommuneListItem[];
  withoutCoordinatesCount: number;
};

export function ProspectionMapLazy(props: Props) {
  return <ProspectionMap {...props} />;
}
