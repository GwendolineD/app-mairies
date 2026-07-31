"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DatePickerField } from "@/components/ui/date-picker-field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  FilterRow,
  FilterSection,
  FilterSheetTrigger,
} from "@/components/ui/filter-sheet";
import { Label } from "@/components/ui/label";
import {
  FilterMobileSheetPanel,
  FilterMobileTriggerButton,
  useFilterSheetState,
} from "@/components/ui/responsive-filter-bar";
import { resolveEndDateAfterStartChange } from "@/lib/datetime";
import type { PilotCommuneOption } from "@/lib/queries/backoffice-communes";
import type {
  ContentCategoryOption,
  ContentTypeCounts,
} from "@/lib/queries/backoffice-contenus";
import {
  BACKOFFICE_CONTENUS_TABS,
  BACKOFFICE_CONTENUS_TAB_LABELS,
  BACKOFFICE_CONTENT_SORT,
  BACKOFFICE_CONTENT_STATUS_LABELS,
  activeBackofficeContenusFilterCount,
  statusesForContentType,
  type BackofficeContenusListParams,
  type BackofficeContentStatus,
  type BackofficeContentType,
} from "@/lib/utils/backoffice-contenus-params";
import { cn } from "@/lib/utils/cn";
import { ContenusStatsBar, CONTENT_TYPE_CONFIG } from "./contenus-stats-bar";
import { useContenusTabFilters } from "./use-contenus-tab-filters";

type ContenusToolbarProps = {
  params: BackofficeContenusListParams;
  communes: PilotCommuneOption[];
  categories: ContentCategoryOption[];
  totalCount: number;
  counts: ContentTypeCounts;
};

export function ContenusToolbar({
  params,
  communes,
  categories,
  totalCount,
  counts,
}: ContenusToolbarProps) {
  const { navigate, switchTab } = useContenusTabFilters(params);
  const [search, setSearch] = useState(params.q);
  const [desktopFiltersOpen, setDesktopFiltersOpen] = useState(false);

  const isStatsTab = params.tab === "stats";
  const contentTab: BackofficeContentType =
    params.tab === "stats" ? "announcement" : params.tab;

  const statusOptions = statusesForContentType(contentTab, []).map((status) => ({
    value: status,
    label: BACKOFFICE_CONTENT_STATUS_LABELS[status],
  }));

  const showSubtypeFilter = !isStatsTab && params.tab === "announcement";
  const showOfficialFilter = !isStatsTab && params.tab === "event";

  useEffect(() => {
    setSearch(params.q);
  }, [params.q]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (search === params.q) return;
      navigate({ q: search || undefined });
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [search, params.q, navigate]);

  function clearSearch() {
    setSearch("");
    navigate({ q: undefined });
  }

  function toggleStatus(status: BackofficeContentStatus) {
    const next = params.statuses.includes(status)
      ? params.statuses.filter((value) => value !== status)
      : [...params.statuses, status];
    navigate({ statuses: next });
  }

  const filterCount = activeBackofficeContenusFilterCount(params);
  const { open, setOpen } = useFilterSheetState();

  function closeFilters() {
    setOpen(false);
    setDesktopFiltersOpen(false);
  }

  function clearAllFilters() {
    navigate({
      commune: undefined,
      statuses: [],
      suspended: undefined,
      subtype: undefined,
      category: undefined,
      official: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      sort: BACKOFFICE_CONTENT_SORT.newest,
    });
  }

  const filterSections = (
    <>
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
        {statusOptions.map((option) => {
          const checked = params.statuses.includes(option.value);
          return (
            <FilterRow
              key={option.value}
              checked={checked}
              onCheckboxToggle={() => toggleStatus(option.value)}
              onRowSelect={() => {
                navigate({ statuses: [option.value] });
                closeFilters();
              }}
              label={option.label}
            />
          );
        })}
      </FilterSection>

      <FilterSection title="Modération">
        <FilterRow
          checked={params.suspended === undefined}
          onCheckboxToggle={() => {
            if (params.suspended === undefined) return;
            navigate({ suspended: undefined });
          }}
          onRowSelect={() => {
            navigate({ suspended: undefined });
            closeFilters();
          }}
          label="Toutes"
        />
        <FilterRow
          checked={params.suspended === true}
          onCheckboxToggle={() =>
            navigate({
              suspended: params.suspended === true ? undefined : true,
            })
          }
          onRowSelect={() => {
            navigate({ suspended: true });
            closeFilters();
          }}
          label="Suspendus uniquement"
        />
        <FilterRow
          checked={params.suspended === false}
          onCheckboxToggle={() =>
            navigate({
              suspended: params.suspended === false ? undefined : false,
            })
          }
          onRowSelect={() => {
            navigate({ suspended: false });
            closeFilters();
          }}
          label="Non suspendus"
        />
      </FilterSection>

      {showSubtypeFilter ? (
        <FilterSection title="Sous-type">
          <FilterRow
            checked={!params.subtype}
            onCheckboxToggle={() => {
              if (!params.subtype) return;
              navigate({ subtype: undefined });
            }}
            onRowSelect={() => {
              navigate({ subtype: undefined });
              closeFilters();
            }}
            label="Tous les sous-types"
          />
          <FilterRow
            checked={params.subtype === "demande"}
            onCheckboxToggle={() =>
              navigate({
                subtype: params.subtype === "demande" ? undefined : "demande",
              })
            }
            onRowSelect={() => {
              navigate({ subtype: "demande" });
              closeFilters();
            }}
            label="Demande"
          />
          <FilterRow
            checked={params.subtype === "offre"}
            onCheckboxToggle={() =>
              navigate({
                subtype: params.subtype === "offre" ? undefined : "offre",
              })
            }
            onRowSelect={() => {
              navigate({ subtype: "offre" });
              closeFilters();
            }}
            label="Offre"
          />
        </FilterSection>
      ) : null}

      {categories.length > 0 ? (
        <FilterSection title="Catégorie">
          <FilterRow
            checked={!params.category}
            onCheckboxToggle={() => {
              if (!params.category) return;
              navigate({ category: undefined });
            }}
            onRowSelect={() => {
              navigate({ category: undefined });
              closeFilters();
            }}
            label="Toutes les catégories"
          />
          {categories.map((category) => {
            const checked = params.category === category.slug;
            return (
              <FilterRow
                key={`${category.contentType}:${category.slug}`}
                checked={checked}
                onCheckboxToggle={() =>
                  navigate({
                    category: checked ? undefined : category.slug,
                  })
                }
                onRowSelect={() => {
                  navigate({ category: category.slug });
                  closeFilters();
                }}
                label={category.label}
              />
            );
          })}
        </FilterSection>
      ) : null}

      {showOfficialFilter ? (
        <FilterSection title="Événement">
          <FilterRow
            checked={params.official === undefined}
            onCheckboxToggle={() => {
              if (params.official === undefined) return;
              navigate({ official: undefined });
            }}
            onRowSelect={() => {
              navigate({ official: undefined });
              closeFilters();
            }}
            label="Tous"
          />
          <FilterRow
            checked={params.official === true}
            onCheckboxToggle={() =>
              navigate({
                official: params.official === true ? undefined : true,
              })
            }
            onRowSelect={() => {
              navigate({ official: true });
              closeFilters();
            }}
            label="Officiels mairie"
          />
          <FilterRow
            checked={params.official === false}
            onCheckboxToggle={() =>
              navigate({
                official: params.official === false ? undefined : false,
              })
            }
            onRowSelect={() => {
              navigate({ official: false });
              closeFilters();
            }}
            label="Communautaires"
          />
        </FilterSection>
      ) : null}

      <FilterSection title="Période">
        <FilterRow
          checked={!params.dateFrom && !params.dateTo}
          onCheckboxToggle={() => {
            if (!params.dateFrom && !params.dateTo) return;
            navigate({ dateFrom: undefined, dateTo: undefined });
          }}
          onRowSelect={() => {
            navigate({ dateFrom: undefined, dateTo: undefined });
          }}
          label="Toutes les dates"
        />
        <ContenusDateRangeFields
          dateFrom={params.dateFrom}
          dateTo={params.dateTo}
          onChange={(dateFrom, dateTo) => navigate({ dateFrom, dateTo })}
        />
      </FilterSection>

      <FilterSection title="Tri">
        <FilterRow
          checked={params.sort === BACKOFFICE_CONTENT_SORT.newest}
          onCheckboxToggle={() => {
            if (params.sort === BACKOFFICE_CONTENT_SORT.newest) return;
            navigate({ sort: BACKOFFICE_CONTENT_SORT.newest });
          }}
          onRowSelect={() => {
            navigate({ sort: BACKOFFICE_CONTENT_SORT.newest });
            closeFilters();
          }}
          label="Plus récents"
        />
        <FilterRow
          checked={params.sort === BACKOFFICE_CONTENT_SORT.oldest}
          onCheckboxToggle={() => {
            if (params.sort === BACKOFFICE_CONTENT_SORT.oldest) return;
            navigate({ sort: BACKOFFICE_CONTENT_SORT.oldest });
          }}
          onRowSelect={() => {
            navigate({ sort: BACKOFFICE_CONTENT_SORT.oldest });
            closeFilters();
          }}
          label="Plus anciens"
        />
      </FilterSection>
    </>
  );

  return (
    <div className="flex flex-col gap-4">
      <ContenusStatsBar
        counts={counts}
        activeTab={params.tab}
        onTabSelect={switchTab}
      />

      <nav className="flex gap-1 overflow-x-auto border-b border-border">
        {BACKOFFICE_CONTENUS_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={params.tab === tab}
            onClick={() => switchTab(tab)}
            className={cn(
              "shrink-0 cursor-pointer px-3 py-2 text-sm font-semibold transition",
              params.tab === tab
                ? tab === "stats"
                  ? "border-b-2 border-purple text-purple"
                  : CONTENT_TYPE_CONFIG[tab].tabActiveClass
                : "text-muted hover:text-text",
            )}
          >
            {BACKOFFICE_CONTENUS_TAB_LABELS[tab]}
          </button>
        ))}
      </nav>

      {!isStatsTab ? (
        <div className="flex min-w-0 items-center gap-2">
        <div className="relative min-w-0 flex-1 max-w-md">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher par titre"
            className="rounded-sm pr-9 placeholder:text-xs md:placeholder:text-sm"
            aria-label="Rechercher par titre"
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

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <FilterMobileTriggerButton
            filterCount={filterCount}
            onClick={() => setOpen(true)}
            className="md:hidden"
          />
          <FilterMobileSheetPanel
            open={open}
            onClose={() => setOpen(false)}
            filterCount={filterCount}
            totalResults={totalCount}
            onClearAll={clearAllFilters}
          >
            {filterSections}
          </FilterMobileSheetPanel>

          <Popover open={desktopFiltersOpen} onOpenChange={setDesktopFiltersOpen}>
            <PopoverTrigger
              render={
                <FilterSheetTrigger
                  count={filterCount}
                  iconOnly
                  className="hidden md:inline-flex"
                  onClick={() => undefined}
                />
              }
            />
            <PopoverContent
              align="end"
              sideOffset={8}
              className="w-[min(92vw,360px)] gap-0 p-0"
            >
              <div className="border-b border-border px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-bold text-text">Filtres</h2>
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

              <div className="max-h-[70vh] overflow-y-auto">{filterSections}</div>

              <div className="border-t border-border px-4 py-3">
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setDesktopFiltersOpen(false)}
                  >
                    Voir les {totalCount} résultats
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      ) : null}
    </div>
  );
}

function ContenusDateRangeFields({
  dateFrom,
  dateTo,
  onChange,
}: {
  dateFrom?: string;
  dateTo?: string;
  onChange: (dateFrom?: string, dateTo?: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 px-4 py-2.5 sm:grid-cols-2">
      <div className="space-y-1">
        <Label htmlFor="contenus-date-from" className="text-xs text-subtle">
          Date de début
        </Label>
        <DatePickerField
          id="contenus-date-from"
          value={dateFrom ?? ""}
          onChange={(value) =>
            onChange(
              value || undefined,
              dateTo
                ? resolveEndDateAfterStartChange(value, dateTo)
                : undefined,
            )
          }
          maxDate={dateTo}
          placeholder="Choisir une date"
          className="w-full"
          aria-label="Date de début"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="contenus-date-to" className="text-xs text-subtle">
          Date de fin
        </Label>
        <DatePickerField
          id="contenus-date-to"
          value={dateTo ?? ""}
          onChange={(value) => onChange(dateFrom, value || undefined)}
          minDate={dateFrom}
          placeholder="Choisir une date"
          className="w-full"
          aria-label="Date de fin"
        />
      </div>
    </div>
  );
}
