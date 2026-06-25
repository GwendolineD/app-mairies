"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  ArrowUpDown,
  CalendarDays,
  ChevronDown,
  HandHeart,
  Megaphone,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";
import { ANNOUNCEMENT_TYPES } from "@/lib/constants/announcement-types";
import {
  activeReportFilterCount,
  buildReportListQuery,
  REPORT_CONTENT_FILTERS,
  REPORT_STATUS_FILTERS,
  type ReportContentFilter,
  type ReportListParams,
  type ReportStatusFilter,
} from "@/lib/utils/report-list-params";
import type { SortMode } from "@/lib/utils/search-params";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FilterHelpPopover } from "@/components/ui/filter-help-popover";
import { cn } from "@/lib/utils/cn";
import { ReportSearch } from "./report-search";

type Props = {
  params: ReportListParams;
  totalCount: number;
};

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "recent", label: "Les plus récents" },
  { value: "oldest", label: "Les plus anciens" },
];

const CONTENT_FILTER_ICONS = {
  demande: Megaphone,
  offre: HandHeart,
  initiative: Sparkles,
  event: CalendarDays,
} as const;

export function ReportListToolbar({ params, totalCount }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const filterCount = activeReportFilterCount(params);
  const countLabel = `${totalCount} signalement${totalCount !== 1 ? "s" : ""}`;

  function navigate(partial: Partial<ReportListParams>) {
    const next = { ...params, ...partial };
    router.push(`${pathname}${buildReportListQuery(next)}`);
  }

  const sortAndFilters = (
    <div className="flex items-center gap-2">
      <SortPopover params={params} navigate={navigate} />
      <FiltersPopover params={params} navigate={navigate} count={filterCount} />
    </div>
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ReportSearch params={params} />
        {sortAndFilters}
      </div>
      <p className="text-xs font-medium text-muted">{countLabel}</p>
    </div>
  );
}

function SortPopover({
  params,
  navigate,
}: {
  params: ReportListParams;
  navigate: (partial: Partial<ReportListParams>) => void;
}) {
  const [open, setOpen] = useState(false);
  const currentLabel =
    SORT_OPTIONS.find((option) => option.value === params.tri)?.label ??
    "Trier par";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="relative inline-flex cursor-pointer items-center gap-1.5 rounded-sm border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-muted transition hover:border-purple/30"
          >
            <ArrowUpDown className="size-3.5" aria-hidden />
            <span>{currentLabel}</span>
            <ChevronDown className="size-3.5" aria-hidden />
          </button>
        }
      />
      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={6}
        className="z-1200 w-48 gap-0 overflow-hidden rounded-sm border border-border bg-surface p-0 shadow-card"
      >
        {SORT_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              navigate({ tri: option.value });
              setOpen(false);
            }}
            className={cn(
              "flex w-full cursor-pointer items-center px-3 py-2.5 text-xs font-medium transition",
              params.tri === option.value
                ? "bg-soft-pink text-purple"
                : "text-text hover:bg-warm",
            )}
          >
            {option.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function FiltersPopover({
  params,
  navigate,
  count,
}: {
  params: ReportListParams;
  navigate: (partial: Partial<ReportListParams>) => void;
  count: number;
}) {
  const [open, setOpen] = useState(false);

  function clearAll() {
    navigate({ statuses: ["pending"], contentTypes: [] });
  }

  function toggleStatus(status: ReportStatusFilter) {
    const checked = params.statuses.includes(status);
    const next = checked
      ? params.statuses.filter((item) => item !== status)
      : [...params.statuses, status];
    navigate({ statuses: next });
  }

  function toggleContentType(contentType: ReportContentFilter) {
    const checked = params.contentTypes.includes(contentType);
    const next = checked
      ? params.contentTypes.filter((item) => item !== contentType)
      : [...params.contentTypes, contentType];
    navigate({ contentTypes: next });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={cn(
              "relative inline-flex cursor-pointer items-center gap-1.5 rounded-sm border bg-surface px-2.5 py-1.5 text-xs font-semibold transition hover:border-purple/30",
              count > 0
                ? "border-purple/40 text-purple"
                : "border-border text-muted",
            )}
          >
            <SlidersHorizontal className="size-3.5" aria-hidden />
            <span>Filtres</span>
            {count > 0 ? (
              <span className="inline-flex size-4 items-center justify-center rounded-full bg-purple text-[10px] font-bold text-white">
                {count}
              </span>
            ) : null}
          </button>
        }
      />
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(92vw,360px)] gap-0 p-0"
      >
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <h2 className="text-sm font-bold text-text">Filtres</h2>
              <FilterHelpPopover />
            </div>
            <div className="flex items-center gap-1">
              {count > 0 ? (
                <button
                  type="button"
                  onClick={clearAll}
                  className="cursor-pointer whitespace-nowrap text-xs font-semibold text-muted hover:text-text"
                >
                  Tout effacer
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer les filtres"
                className="inline-flex size-7 cursor-pointer items-center justify-center rounded-sm text-muted hover:bg-warm hover:text-text"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto">
          <FilterSection title="Statut">
            <FilterRow
              checked={params.statuses.length === 0}
              onCheckboxToggle={() =>
                navigate({
                  statuses: params.statuses.length === 0 ? ["pending"] : [],
                })
              }
              onRowSelect={() => {
                navigate({ statuses: [] });
                setOpen(false);
              }}
              label="Tous les statuts"
            />
            {REPORT_STATUS_FILTERS.map((item) => {
              const checked = params.statuses.includes(item.key);
              return (
                <FilterRow
                  key={item.key}
                  checked={checked}
                  onCheckboxToggle={() => toggleStatus(item.key)}
                  onRowSelect={() => {
                    navigate({ statuses: [item.key] });
                    setOpen(false);
                  }}
                  label={item.label}
                />
              );
            })}
          </FilterSection>

          <FilterSection title="Type de contenu">
            <FilterRow
              checked={params.contentTypes.length === 0}
              onCheckboxToggle={() => navigate({ contentTypes: [] })}
              onRowSelect={() => {
                navigate({ contentTypes: [] });
                setOpen(false);
              }}
              label="Tous les types"
            />
            {REPORT_CONTENT_FILTERS.map((item) => {
              const checked = params.contentTypes.includes(item.key);
              const Icon = CONTENT_FILTER_ICONS[item.key];
              const announcementType = ANNOUNCEMENT_TYPES.find(
                (type) => type.slug === item.key,
              );
              return (
                <FilterRow
                  key={item.key}
                  checked={checked}
                  icon={Icon}
                  iconClassName={
                    announcementType
                      ? cn("text-white", announcementType.gradient)
                      : item.key === "initiative"
                        ? "bg-mint/15 text-mint"
                        : "bg-orange/15 text-orange"
                  }
                  onCheckboxToggle={() => toggleContentType(item.key)}
                  onRowSelect={() => {
                    navigate({ contentTypes: [item.key] });
                    setOpen(false);
                  }}
                  label={item.label}
                />
              );
            })}
          </FilterSection>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-border py-2 last:border-0">
      <h3 className="px-4 pb-1 pt-2 text-[11px] font-bold uppercase tracking-widest text-muted">
        {title}
      </h3>
      <div className="flex flex-col">{children}</div>
    </section>
  );
}

function FilterRow({
  checked,
  onCheckboxToggle,
  onRowSelect,
  label,
  icon: Icon,
  iconClassName,
}: {
  checked: boolean;
  onCheckboxToggle: () => void;
  onRowSelect: () => void;
  label: string;
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  iconClassName?: string;
}) {
  return (
    <div className="flex w-full items-center gap-3 px-4 py-2.5 transition hover:bg-warm/60 md:py-2">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={label}
        onClick={(event) => {
          event.stopPropagation();
          onCheckboxToggle();
        }}
        className={cn(
          "inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-sm border-2 transition md:size-5",
          checked
            ? "border-purple bg-purple text-white"
            : "border-border bg-surface text-transparent hover:border-purple/40",
        )}
      >
        <CheckGlyph />
      </button>
      <button
        type="button"
        onClick={onRowSelect}
        className="flex flex-1 cursor-pointer items-center gap-2 text-left text-sm font-medium text-text"
      >
        {Icon ? (
          <span
            className={cn(
              "inline-flex size-6 shrink-0 items-center justify-center rounded-full",
              iconClassName,
            )}
          >
            <Icon className="size-3.5" aria-hidden />
          </span>
        ) : null}
        <span className="flex-1 truncate">{label}</span>
      </button>
    </div>
  );
}

function CheckGlyph() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden
      className="size-3.5 stroke-current"
      fill="none"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3.5 8.5 6.5 11.5 12.5 4.5" />
    </svg>
  );
}
