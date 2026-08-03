"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import {
  FilterRow,
  FilterSection,
} from "@/components/ui/filter-sheet";
import {
  FilterMobileSheetPanel,
  FilterMobileTriggerButton,
  useFilterSheetState,
} from "@/components/ui/responsive-filter-bar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FilterHelpPopover } from "@/components/ui/filter-help-popover";
import type { PilotCommuneOption } from "@/lib/queries/backoffice-communes";
import type { SupportRequestStatus } from "@/lib/types";
import {
  activeBackofficeAssistanceFilterCount,
  ASSISTANCE_STATUS_FILTERS,
  buildBackofficeAssistanceListQuery,
  DEFAULT_ASSISTANCE_STATUSES,
  type BackofficeAssistanceListParams,
} from "@/lib/utils/backoffice-assistance-params";
import type { SortMode } from "@/lib/utils/search-params";
import { cn } from "@/lib/utils/cn";

type Props = {
  params: BackofficeAssistanceListParams;
  communes: PilotCommuneOption[];
  totalCount: number;
};

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "recent", label: "Les plus récents" },
  { value: "oldest", label: "Les plus anciens" },
];

function FilterTriggerButton({
  filterCount,
  className,
  ...props
}: React.ComponentProps<"button"> & { filterCount: number }) {
  return (
    <button
      type="button"
      aria-label={
        filterCount > 0 ? `Filtres (${filterCount} actifs)` : "Ouvrir les filtres"
      }
      className={cn(
        "relative inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-sm border bg-surface transition hover:border-purple/30 md:size-8",
        filterCount > 0
          ? "border-purple/40 text-purple"
          : "border-border text-muted",
        className,
      )}
      {...props}
    >
      <SlidersHorizontal className="size-4" aria-hidden />
      {filterCount > 0 ? (
        <span className="absolute -top-1 -right-1 inline-flex size-4 items-center justify-center rounded-full bg-purple text-[10px] font-bold text-white">
          {filterCount > 99 ? "99+" : filterCount}
        </span>
      ) : null}
    </button>
  );
}

export function AssistanceToolbar({ params, communes, totalCount }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchDraft, setSearchDraft] = useState<string | null>(null);
  const [committedQ, setCommittedQ] = useState(params.q);

  if (params.q !== committedQ) {
    setCommittedQ(params.q);
    setSearchDraft(null);
  }

  const search = searchDraft ?? params.q;
  const [desktopFiltersOpen, setDesktopFiltersOpen] = useState(false);
  const { open, setOpen } = useFilterSheetState();

  const navigate = useCallback(
    (next: Partial<BackofficeAssistanceListParams>) => {
      startTransition(() => {
        router.push(
          `${pathname}${buildBackofficeAssistanceListQuery({
            ...params,
            page: 1,
            ...next,
          })}`,
        );
      });
    },
    [params, pathname, router],
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const trimmed = search.trim();
      if (trimmed === params.q) return;
      navigate({ q: trimmed });
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [search, params.q, navigate]);

  function clearSearch() {
    setSearchDraft(null);
    navigate({ q: "" });
  }

  function closeFilters() {
    setOpen(false);
    setDesktopFiltersOpen(false);
  }

  function clearAllFilters() {
    navigate({
      statuses: [...DEFAULT_ASSISTANCE_STATUSES],
      commune: undefined,
      tri: "recent",
    });
    closeFilters();
  }

  function toggleStatus(status: SupportRequestStatus) {
    const next = params.statuses.includes(status)
      ? params.statuses.filter((value) => value !== status)
      : [...params.statuses, status];
    navigate({ statuses: next });
  }

  const filterCount = activeBackofficeAssistanceFilterCount(params);
  const countLabel = `${totalCount} demande${totalCount !== 1 ? "s" : ""}`;

  const filterSections = (
    <>
      <FilterSection title="Statut">
        <FilterRow
          checked={params.statuses.length === 0}
          onCheckboxToggle={() => {
            if (params.statuses.length === 0) return;
            navigate({ statuses: [] });
          }}
          onRowSelect={() => {
            navigate({ statuses: [] });
            closeFilters();
          }}
          label="Tous les statuts"
        />
        {ASSISTANCE_STATUS_FILTERS.map((item) => {
          const checked = params.statuses.includes(item.key);
          return (
            <FilterRow
              key={item.key}
              checked={checked}
              onCheckboxToggle={() => toggleStatus(item.key)}
              onRowSelect={() => {
                navigate({ statuses: [item.key] });
                closeFilters();
              }}
              label={item.label}
            />
          );
        })}
      </FilterSection>

      <FilterSection title="Commune">
        <FilterRow
          checked={!params.commune}
          onCheckboxToggle={() => {
            if (!params.commune) return;
            navigate({ commune: undefined });
          }}
          onRowSelect={() => {
            navigate({ commune: undefined });
            closeFilters();
          }}
          label="Toutes les communes"
        />
        {communes.map((commune) => {
          const label = commune.postcode
            ? `${commune.name} (${commune.postcode})`
            : commune.name;
          const checked = params.commune === commune.id;
          return (
            <FilterRow
              key={commune.id}
              checked={checked}
              onCheckboxToggle={() =>
                navigate({
                  commune: checked ? undefined : commune.id,
                })
              }
              onRowSelect={() => {
                navigate({ commune: commune.id });
                closeFilters();
              }}
              label={label}
            />
          );
        })}
      </FilterSection>

      <FilterSection title="Tri">
        {SORT_OPTIONS.map((option) => {
          const checked = params.tri === option.value;
          return (
            <FilterRow
              key={option.value}
              checked={checked}
              onCheckboxToggle={() => {
                if (checked) return;
                navigate({ tri: option.value });
              }}
              onRowSelect={() => {
                navigate({ tri: option.value });
                closeFilters();
              }}
              label={option.label}
            />
          );
        })}
      </FilterSection>
    </>
  );

  const filtersPanelHeader = (
    <div className="border-b border-border px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <h2 className="text-sm font-bold text-text">Filtres</h2>
          <FilterHelpPopover />
        </div>
        <div className="flex items-center gap-1">
          {filterCount > 0 ? (
            <button
              type="button"
              onClick={clearAllFilters}
              className="cursor-pointer whitespace-nowrap text-xs font-semibold text-muted hover:text-text"
            >
              Tout effacer
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setDesktopFiltersOpen(false)}
            aria-label="Fermer les filtres"
            className="inline-flex size-7 cursor-pointer items-center justify-center rounded-sm text-muted hover:bg-warm hover:text-text"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 max-w-md">
          <Input
            value={search}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="Rechercher par objet, message, auteur…"
            aria-label="Rechercher une demande d'assistance"
            className="rounded-sm pr-9 placeholder:text-xs md:placeholder:text-sm"
          />
          {search.length > 0 ? (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm text-muted transition hover:text-text"
              aria-label="Effacer la recherche"
            >
              <X className="size-4" aria-hidden />
            </button>
          ) : null}
        </div>

        <FilterMobileTriggerButton
          filterCount={filterCount}
          onClick={() => setOpen(true)}
          className="md:hidden"
        />

        <Popover
          open={desktopFiltersOpen}
          onOpenChange={setDesktopFiltersOpen}
        >
          <PopoverTrigger
            render={
              <FilterTriggerButton
                filterCount={filterCount}
                className="hidden md:inline-flex"
              />
            }
          />
          <PopoverContent
            align="end"
            sideOffset={8}
            className="z-1200 w-[min(92vw,360px)] gap-0 overflow-hidden rounded-sm border border-border bg-surface p-0 shadow-card"
          >
            {filtersPanelHeader}
            <div className="max-h-[70vh] overflow-y-auto">{filterSections}</div>
          </PopoverContent>
        </Popover>
      </div>

      <FilterMobileSheetPanel
        open={open}
        onClose={() => setOpen(false)}
        filterCount={filterCount}
        totalResults={totalCount}
        onClearAll={clearAllFilters}
      >
        {filterSections}
      </FilterMobileSheetPanel>

      <p className="text-xs font-medium text-muted">
        {countLabel}
        {isPending ? " · mise à jour…" : null}
      </p>
    </div>
  );
}
