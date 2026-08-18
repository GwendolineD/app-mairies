"use client";

import { List, Map, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { FilterRow, FilterSection } from "@/components/ui/filter-sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  FilterMobileSheetPanel,
  FilterMobileTriggerButton,
  useFilterSheetState,
} from "@/components/ui/responsive-filter-bar";
import {
  activeProspectCommunesFilterCount,
  buildProspectCommunesQuery,
  clearProspectCommunesFilters,
  mergeProspectCommunesParams,
  parseVisitDateParam,
  type ProspectCommunesListParams,
} from "@/lib/prospect-communes/filter-params";
import {
  POPULATION_BUCKETS,
  POPULATION_COLOR_HEX,
} from "@/lib/prospect-communes/population-buckets";
import {
  OPENING_DAY_OPTIONS,
  PROSPECT_COMMUNES_UNPAGINATED_MAX,
  PROSPECT_DEPARTEMENT_OPTIONS,
} from "@/lib/prospect-communes/types";
import {
  PROSPECT_OUTREACH_STATUSES,
  PROSPECT_OUTREACH_STATUS_LABELS,
} from "@/lib/prospect-outreach/types";
import { cn } from "@/lib/utils/cn";

type Props = {
  params: ProspectCommunesListParams;
  totalCount: number;
  truncated: boolean;
  className?: string;
};

const TOOLBAR_INPUT_CLASS = "rounded-sm md:max-w-xs";

function toggleValue<T extends string>(values: T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((entry) => entry !== value)
    : [...values, value];
}

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
        "relative hidden shrink-0 cursor-pointer items-center justify-center rounded-sm border bg-surface transition hover:border-purple/30 md:inline-flex md:size-8",
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

function ViewToggle({
  view,
  onChange,
}: {
  view: ProspectCommunesListParams["view"];
  onChange: (view: ProspectCommunesListParams["view"]) => void;
}) {
  return (
    <div className="inline-flex shrink-0 rounded-sm border border-border bg-surface p-0.5">
      <button
        type="button"
        onClick={() => onChange("list")}
        className={cn(
          "inline-flex cursor-pointer items-center gap-1 rounded-sm px-3 py-1.5 text-xs font-semibold",
          view === "list"
            ? "bg-soft-pink text-purple"
            : "text-muted hover:text-text",
        )}
      >
        <List className="size-4" aria-hidden />
        Liste
      </button>
      <button
        type="button"
        onClick={() => onChange("map")}
        className={cn(
          "inline-flex cursor-pointer items-center gap-1 rounded-sm px-3 py-1.5 text-xs font-semibold",
          view === "map"
            ? "bg-soft-pink text-purple"
            : "text-muted hover:text-text",
        )}
      >
        <Map className="size-4" aria-hidden />
        Carte
      </button>
    </div>
  );
}

export function ProspectionToolbar({
  params,
  totalCount,
  truncated,
  className,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { open, setOpen } = useFilterSheetState();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [qDraft, setQDraft] = useState(params.q);
  const [maireDraft, setMaireDraft] = useState(params.maire);
  const filterCount = activeProspectCommunesFilterCount(params);

  const pushParams = useCallback(
    (next: ProspectCommunesListParams) => {
      startTransition(() => {
        router.replace(`${pathname}${buildProspectCommunesQuery(next)}`);
      });
    },
    [pathname, router, startTransition],
  );

  useEffect(() => {
    setQDraft(params.q);
    setMaireDraft(params.maire);
  }, [params.q, params.maire]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (qDraft === params.q) return;
      pushParams(mergeProspectCommunesParams(params, { q: qDraft }));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [qDraft, params, pushParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (maireDraft === params.maire) return;
      pushParams(mergeProspectCommunesParams(params, { maire: maireDraft }));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [maireDraft, params, pushParams]);

  function setView(view: ProspectCommunesListParams["view"]) {
    pushParams(mergeProspectCommunesParams(params, { view }));
  }

  function resetFilters() {
    pushParams(clearProspectCommunesFilters(params));
    setOpen(false);
    setFiltersOpen(false);
  }

  const filterControls = (
    <div className="space-y-4">
      <FilterSection title="Statut prospection">
        <div className="flex flex-wrap gap-2">
          {PROSPECT_OUTREACH_STATUSES.map((status) => {
            const active = params.outreachStatuses.includes(status);
            return (
              <button
                key={status}
                type="button"
                onClick={() =>
                  pushParams(
                    mergeProspectCommunesParams(params, {
                      outreachStatuses: toggleValue(
                        params.outreachStatuses,
                        status,
                      ),
                    }),
                  )
                }
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold",
                  active
                    ? "border-purple/40 bg-soft-pink text-purple"
                    : "border-border text-muted",
                )}
              >
                {PROSPECT_OUTREACH_STATUS_LABELS[status]}
              </button>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Ouverture & contact">
        <div className="flex flex-wrap gap-2">
          {OPENING_DAY_OPTIONS.map((day) => {
            const active = params.openingDays.includes(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() =>
                  pushParams(
                    mergeProspectCommunesParams(params, {
                      openingDays: toggleValue(params.openingDays, day),
                    }),
                  )
                }
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold",
                  active
                    ? "border-purple/40 bg-soft-pink text-purple"
                    : "border-border text-muted",
                )}
              >
                {day}
              </button>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Suivi des visites">
        <FilterRow
          checked={params.visitDate === "none"}
          onCheckboxToggle={() =>
            pushParams(
              mergeProspectCommunesParams(params, {
                visitDate: params.visitDate === "none" ? undefined : "none",
              }),
            )
          }
          onRowSelect={() =>
            pushParams(
              mergeProspectCommunesParams(params, {
                visitDate: "none",
              }),
            )
          }
          label="Sans date de visite"
        />
        <div className="flex flex-wrap gap-3 px-4 py-2.5">
          <div className="min-w-32 flex-1 space-y-1">
            <Label className="text-xs text-subtle">Date de visite</Label>
            <DatePickerField
              value={params.visitDate === "none" ? "" : (params.visitDate ?? "")}
              onChange={(value) =>
                pushParams(
                  mergeProspectCommunesParams(params, {
                    visitDate: parseVisitDateParam(value),
                  }),
                )
              }
              placeholder="Choisir une date"
              className="w-full"
              aria-label="Date de visite"
            />
          </div>
          <div className="min-w-32 flex-1 space-y-1">
            <Label className="text-xs text-subtle">Date de conseil municipal</Label>
            <DatePickerField
              value={params.councilDate ?? ""}
              onChange={(value) =>
                pushParams(
                  mergeProspectCommunesParams(params, {
                    councilDate: value || undefined,
                  }),
                )
              }
              placeholder="Choisir une date"
              className="w-full"
              aria-label="Date de conseil municipal"
            />
          </div>
        </div>
      </FilterSection>

      <FilterSection title="Taille de commune">
        <div className="flex flex-wrap gap-2">
          {POPULATION_BUCKETS.map((bucket) => {
            const active = params.populationBuckets.includes(bucket.id);
            return (
              <button
                key={bucket.id}
                type="button"
                onClick={() =>
                  pushParams(
                    mergeProspectCommunesParams(params, {
                      populationBuckets: toggleValue(
                        params.populationBuckets,
                        bucket.id,
                      ),
                    }),
                  )
                }
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold transition",
                  active
                    ? "border-purple/40 bg-soft-pink text-purple"
                    : "border-border bg-surface text-muted hover:border-purple/20",
                )}
                style={
                  active
                    ? {
                        borderColor: POPULATION_COLOR_HEX[bucket.colorToken],
                        color: POPULATION_COLOR_HEX[bucket.colorToken],
                      }
                    : undefined
                }
              >
                {bucket.label}
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <label className="block min-w-32 flex-1 space-y-1 text-sm">
            <span className="font-medium text-muted">Population min</span>
            <Input
              type="number"
              min={0}
              className={TOOLBAR_INPUT_CLASS}
              value={params.popMin ?? ""}
              onChange={(event) =>
                pushParams(
                  mergeProspectCommunesParams(params, {
                    popMin: event.target.value
                      ? Number.parseInt(event.target.value, 10)
                      : undefined,
                  }),
                )
              }
            />
          </label>
          <label className="block min-w-32 flex-1 space-y-1 text-sm">
            <span className="font-medium text-muted">Population max</span>
            <Input
              type="number"
              min={0}
              className={TOOLBAR_INPUT_CLASS}
              value={params.popMax ?? ""}
              onChange={(event) =>
                pushParams(
                  mergeProspectCommunesParams(params, {
                    popMax: event.target.value
                      ? Number.parseInt(event.target.value, 10)
                      : undefined,
                  }),
                )
              }
            />
          </label>
        </div>
      </FilterSection>

      <FilterSection title="Localisation">
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-muted">Code postal</span>
          <Input
            className={TOOLBAR_INPUT_CLASS}
            value={params.cp}
            onChange={(event) =>
              pushParams(
                mergeProspectCommunesParams(params, { cp: event.target.value }),
              )
            }
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          {PROSPECT_DEPARTEMENT_OPTIONS.map((dept) => {
            const active = params.departments.includes(dept);
            return (
              <button
                key={dept}
                type="button"
                onClick={() =>
                  pushParams(
                    mergeProspectCommunesParams(params, {
                      departments: toggleValue(params.departments, dept),
                    }),
                  )
                }
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold",
                  active
                    ? "border-purple/40 bg-soft-pink text-purple"
                    : "border-border text-muted",
                )}
              >
                {dept}
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <label className="block min-w-32 flex-1 space-y-1 text-sm">
            <span className="font-medium text-muted">Distance min (km)</span>
            <Input
              type="number"
              min={0}
              step="0.1"
              className={TOOLBAR_INPUT_CLASS}
              value={params.distMin ?? ""}
              onChange={(event) =>
                pushParams(
                  mergeProspectCommunesParams(params, {
                    distMin: event.target.value
                      ? Number.parseFloat(event.target.value)
                      : undefined,
                  }),
                )
              }
            />
          </label>
          <label className="block min-w-32 flex-1 space-y-1 text-sm">
            <span className="font-medium text-muted">Distance max (km)</span>
            <Input
              type="number"
              min={0}
              step="0.1"
              className={TOOLBAR_INPUT_CLASS}
              value={params.distMax ?? ""}
              onChange={(event) =>
                pushParams(
                  mergeProspectCommunesParams(params, {
                    distMax: event.target.value
                      ? Number.parseFloat(event.target.value)
                      : undefined,
                  }),
                )
              }
            />
          </label>
        </div>
      </FilterSection>
    </div>
  );

  return (
    <div className={cn("space-y-3", isPending && "opacity-70", className)}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-2">
        <ViewToggle view={params.view} onChange={setView} />

        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-2">
          <Input
            value={qDraft}
            onChange={(event) => setQDraft(event.target.value)}
            placeholder="Rechercher une commune…"
            className={cn(TOOLBAR_INPUT_CLASS, "w-full sm:w-64")}
          />
          <Input
            value={maireDraft}
            onChange={(event) => setMaireDraft(event.target.value)}
            placeholder="Prénom ou nom du maire…"
            className={cn(TOOLBAR_INPUT_CLASS, "w-full sm:w-64")}
          />

          <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
            <PopoverTrigger
              render={<FilterTriggerButton filterCount={filterCount} />}
            />
            <PopoverContent
              align="end"
              className="max-h-[min(70dvh,560px)] w-[min(100vw-2rem,420px)] overflow-y-auto rounded-sm p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-text">Filtres</p>
                {filterCount > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="cursor-pointer"
                    onClick={resetFilters}
                  >
                    Réinitialiser
                  </Button>
                ) : null}
              </div>
              {filterControls}
            </PopoverContent>
          </Popover>

          <FilterMobileTriggerButton
            filterCount={filterCount}
            onClick={() => setOpen(true)}
            className="md:hidden"
          />

          {params.bbox ? (
            <span className="rounded-full bg-soft-pink px-2.5 py-1 text-xs font-semibold text-purple">
              Zone sélectionnée
            </span>
          ) : null}
          {filterCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="hidden cursor-pointer md:inline-flex"
              onClick={resetFilters}
            >
              <X className="size-4" aria-hidden />
              Réinitialiser
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-muted">
        <SlidersHorizontal className="size-4 shrink-0" aria-hidden />
        <span>
          {totalCount.toLocaleString("fr-FR")} commune
          {totalCount > 1 ? "s" : ""}
          {truncated
            ? ` (affichage limité à ${PROSPECT_COMMUNES_UNPAGINATED_MAX})`
            : null}
        </span>
        {truncated ? (
          <span className="text-coral">
            Trop de résultats — affinez les filtres ou attendez la pagination v2.
          </span>
        ) : null}
      </div>

      <FilterMobileSheetPanel
        open={open}
        onClose={() => setOpen(false)}
        filterCount={filterCount}
        totalResults={totalCount}
        onClearAll={resetFilters}
      >
        {filterControls}
      </FilterMobileSheetPanel>
    </div>
  );
}
