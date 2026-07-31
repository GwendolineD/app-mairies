"use client";

import {
  CalendarDays,
  Megaphone,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  BACKOFFICE_CONTENT_TYPES,
  BACKOFFICE_CONTENT_TYPE_LABELS,
  type BackofficeContentType,
  type BackofficeContenusTab,
} from "@/lib/utils/backoffice-contenus-params";
import type { ContentTypeCounts } from "@/lib/queries/backoffice-contenus";
import { cn } from "@/lib/utils/cn";

const CONTENT_TYPE_CONFIG: Record<
  BackofficeContentType,
  {
    icon: LucideIcon;
    accentClass: string;
    iconClass: string;
    bgClass: string;
    borderClass: string;
    activeBorderClass: string;
    tabActiveClass: string;
  }
> = {
  announcement: {
    icon: Megaphone,
    accentClass: "text-coral",
    iconClass: "text-coral",
    bgClass: "bg-coral/5",
    borderClass: "border-coral/25",
    activeBorderClass: "border-coral/50 ring-1 ring-coral/20 bg-coral/10",
    tabActiveClass: "border-b-2 border-coral text-coral",
  },
  initiative: {
    icon: Sparkles,
    accentClass: "text-mint",
    iconClass: "text-mint",
    bgClass: "bg-mint/10",
    borderClass: "border-mint/25",
    activeBorderClass: "border-mint/50 ring-1 ring-mint/20 bg-mint/15",
    tabActiveClass: "border-b-2 border-mint text-mint",
  },
  event: {
    icon: CalendarDays,
    accentClass: "text-orange",
    iconClass: "text-orange",
    bgClass: "bg-orange/5",
    borderClass: "border-orange/25",
    activeBorderClass: "border-orange/50 ring-1 ring-orange/20 bg-orange/10",
    tabActiveClass: "border-b-2 border-orange text-orange",
  },
};

export { CONTENT_TYPE_CONFIG };

type ContenusStatsBarProps = {
  counts: ContentTypeCounts;
  activeTab: BackofficeContenusTab;
  onTabSelect: (tab: BackofficeContentType) => void;
};

export function ContenusStatsBar({
  counts,
  activeTab,
  onTabSelect,
}: ContenusStatsBarProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {BACKOFFICE_CONTENT_TYPES.map((type) => {
        const config = CONTENT_TYPE_CONFIG[type];
        const Icon = config.icon;
        const isActive = activeTab === type;

        return (
          <button
            key={type}
            type="button"
            onClick={() => onTabSelect(type)}
            aria-pressed={isActive}
            aria-label={`${BACKOFFICE_CONTENT_TYPE_LABELS[type]} — ${counts[type]} contenus`}
            className="cursor-pointer text-left"
          >
            <Card
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl p-3 transition hover:scale-[1.02] hover:shadow-elevated md:items-start md:gap-1 md:p-4",
                config.bgClass,
                config.borderClass,
                isActive && config.activeBorderClass,
              )}
            >
              <Icon
                className={cn(
                  "size-7 shrink-0 md:hidden",
                  config.iconClass,
                )}
                aria-hidden
              />
              <p className="hidden items-center gap-1.5 text-[11px] font-semibold uppercase text-muted md:flex">
                <Icon
                  className={cn("size-3.5 shrink-0", config.iconClass)}
                  aria-hidden
                />
                {BACKOFFICE_CONTENT_TYPE_LABELS[type]}
              </p>
              <p
                className={cn(
                  "font-bold text-xl md:text-3xl",
                  config.accentClass,
                )}
              >
                {counts[type]}
              </p>
            </Card>
          </button>
        );
      })}
    </div>
  );
}
