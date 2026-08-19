"use client";

import { X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  buildProspectCommunesQuery,
  mergeProspectCommunesParams,
  type ProspectCommunesListParams,
} from "@/lib/prospect-communes/filter-params";
import type { ProspectCommuneDetail } from "@/lib/prospect-communes/types";
import { ProspectOutreachStatusBadge } from "@/lib/prospect-outreach/status-display";
import { cn } from "@/lib/utils/cn";
import { ProspectionDetailFicheTab } from "./prospection-detail-fiche-tab";
import { ProspectionDetailSuiviTab } from "./prospection-detail-suivi-tab";

type Props = {
  detail: ProspectCommuneDetail;
  params: ProspectCommunesListParams;
};

type TabId = "fiche" | "suivi";

export function ProspectionDetailSheet({ detail, params }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [tab, setTab] = useState<TabId>("suivi");

  function close() {
    startTransition(() => {
      router.replace(
        `${pathname}${buildProspectCommunesQuery(
          mergeProspectCommunesParams(params, { detailId: undefined }),
        )}`,
      );
    });
  }

  return (
    <>
      <button
        type="button"
        aria-label="Fermer la fiche"
        className="fixed inset-0 z-1100 cursor-pointer bg-text/20 md:bg-transparent"
        onClick={close}
      />
      <aside
        className={cn(
          "fixed z-1200 flex max-h-[85dvh] w-full flex-col overflow-hidden bg-surface shadow-card",
          "inset-x-0 bottom-0 rounded-t-xl md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[480px] md:rounded-none md:border-l md:border-border",
        )}
      >
        <div className="flex items-start justify-between border-b border-border px-4 py-3">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-text">{detail.commune}</h2>
            <p className="text-xs text-muted">
              Dept. {detail.departement}
              {detail.postcode ? ` · ${detail.postcode}` : null}
              {detail.insee_code ? ` · INSEE ${detail.insee_code}` : null}
            </p>
            <ProspectOutreachStatusBadge
              status={detail.outreach.status}
              outcome={detail.outreach.outcome}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="cursor-pointer"
            onClick={close}
          >
            <X className="size-4" aria-hidden />
            Fermer
          </Button>
        </div>

        <div className="flex border-b border-border px-4">
          {(
            [
              { id: "suivi" as const, label: "Suivi" },
              { id: "fiche" as const, label: "Fiche" },
            ] as const
          ).map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setTab(entry.id)}
              className={cn(
                "cursor-pointer border-b-2 px-3 py-2 text-sm font-semibold transition",
                tab === entry.id
                  ? "border-purple text-purple"
                  : "border-transparent text-muted hover:text-text",
              )}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {tab === "suivi" ? (
            <ProspectionDetailSuiviTab detail={detail} />
          ) : (
            <ProspectionDetailFicheTab detail={detail} />
          )}
        </div>
      </aside>
    </>
  );
}
