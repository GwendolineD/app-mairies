"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  ArrowUpDown,
  ChevronDown,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FilterHelpPopover } from "@/components/ui/filter-help-popover";
import { cn } from "@/lib/utils/cn";
import type { MembershipRole, MembershipStatus } from "@/lib/types";
import {
  activeHabitantsFilterCount,
  buildHabitantsListQuery,
  getInscriptionMonthLabel,
  getInscriptionWeekLabel,
  HABITANTS_ROLE_FILTERS,
  HABITANTS_STATUS_FILTERS,
  isValidInscriptionDateRange,
  type HabitantsInscriptionFilter,
  type HabitantsListParams,
  type HabitantsSort,
} from "@/lib/utils/habitants-list-params";

type Props = {
  params: HabitantsListParams;
  totalCount: number;
};

const SORT_OPTIONS: { value: HabitantsSort; label: string }[] = [
  { value: "recent", label: "Les plus récents" },
  { value: "name_asc", label: "Nom A → Z" },
  { value: "name_desc", label: "Nom Z → A" },
];

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function HabitantsListToolbar({ params, totalCount }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const filterCount = activeHabitantsFilterCount(params);
  const countLabel = `${totalCount} habitant${totalCount !== 1 ? "·es" : "·e"}`;

  function navigate(partial: Partial<HabitantsListParams>) {
    const resetPage = !("page" in partial) && !("limit" in partial);
    const next = {
      ...params,
      ...(resetPage ? { page: 1 } : {}),
      ...partial,
    };
    router.push(`${pathname}${buildHabitantsListQuery(next)}`);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <HabitantsSearch params={params} navigate={navigate} />
        <div className="flex items-center gap-2">
          <SortPopover params={params} navigate={navigate} />
          <FiltersPopover
            params={params}
            navigate={navigate}
            count={filterCount}
          />
        </div>
      </div>
      <p className="text-xs font-medium text-muted">{countLabel}</p>
    </div>
  );
}

function HabitantsSearch({
  params,
  navigate,
}: {
  params: HabitantsListParams;
  navigate: (partial: Partial<HabitantsListParams>) => void;
}) {
  const [search, setSearch] = useState(params.q);

  useEffect(() => {
    setSearch(params.q);
  }, [params.q]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const trimmed = search.trim();
      if (trimmed === params.q) return;
      navigate({ q: trimmed });
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [search, params.q, navigate]);

  function clearSearch() {
    setSearch("");
    navigate({ q: "" });
  }

  return (
    <div className="relative w-full max-w-xs min-w-[200px] flex-1 sm:flex-none">
      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Rechercher par nom ou prénom…"
        aria-label="Rechercher par nom ou prénom"
        className="h-10 py-0 pr-9 text-sm placeholder:text-xs md:h-8 md:py-1 md:text-base md:placeholder:text-sm"
      />
      {search ? (
        <button
          type="button"
          onClick={clearSearch}
          className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-muted hover:text-text"
          aria-label="Effacer la recherche"
        >
          <X className="size-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

function SortPopover({
  params,
  navigate,
}: {
  params: HabitantsListParams;
  navigate: (partial: Partial<HabitantsListParams>) => void;
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
  params: HabitantsListParams;
  navigate: (partial: Partial<HabitantsListParams>) => void;
  count: number;
}) {
  const [open, setOpen] = useState(false);
  const weekHint = getInscriptionWeekLabel();
  const monthHint = capitalize(getInscriptionMonthLabel());

  function clearAll() {
    navigate({
      statuses: [],
      roles: [],
      inscription: undefined,
      inscriptionDebut: undefined,
      inscriptionFin: undefined,
    });
  }

  function clearInscriptionFilter() {
    navigate({
      inscription: undefined,
      inscriptionDebut: undefined,
      inscriptionFin: undefined,
    });
  }

  function selectInscriptionPreset(value: HabitantsInscriptionFilter) {
    navigate({
      inscription: value,
      inscriptionDebut: undefined,
      inscriptionFin: undefined,
    });
  }

  function toggleStatus(status: MembershipStatus) {
    const checked = params.statuses.includes(status);
    const next = checked
      ? params.statuses.filter((item) => item !== status)
      : [...params.statuses, status];
    navigate({ statuses: next });
  }

  function toggleRole(role: MembershipRole) {
    const checked = params.roles.includes(role);
    const next = checked
      ? params.roles.filter((item) => item !== role)
      : [...params.roles, role];
    navigate({ roles: next });
  }

  const hasInscriptionFilter = !!params.inscription;
  const isPersoActive = params.inscription === "perso";

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
                  statuses: params.statuses.length === 0 ? ["active"] : [],
                })
              }
              onRowSelect={() => {
                navigate({ statuses: [] });
                setOpen(false);
              }}
              label="Tous les statuts"
            />
            {HABITANTS_STATUS_FILTERS.map((item) => {
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

          <FilterSection title="Rôle">
            <FilterRow
              checked={params.roles.length === 0}
              onCheckboxToggle={() =>
                navigate({
                  roles: params.roles.length === 0 ? ["member"] : [],
                })
              }
              onRowSelect={() => {
                navigate({ roles: [] });
                setOpen(false);
              }}
              label="Tous les rôles"
            />
            {HABITANTS_ROLE_FILTERS.map((item) => {
              const checked = params.roles.includes(item.key);
              return (
                <FilterRow
                  key={item.key}
                  checked={checked}
                  onCheckboxToggle={() => toggleRole(item.key)}
                  onRowSelect={() => {
                    navigate({ roles: [item.key] });
                    setOpen(false);
                  }}
                  label={item.label}
                />
              );
            })}
          </FilterSection>

          <FilterSection title="Date d'inscription">
            <FilterRow
              checked={!hasInscriptionFilter}
              onCheckboxToggle={clearInscriptionFilter}
              onRowSelect={() => {
                clearInscriptionFilter();
                setOpen(false);
              }}
              label="Toutes les dates"
            />
            <FilterRow
              checked={params.inscription === "semaine"}
              onCheckboxToggle={() => {
                if (params.inscription === "semaine") {
                  clearInscriptionFilter();
                } else {
                  selectInscriptionPreset("semaine");
                }
              }}
              onRowSelect={() => {
                selectInscriptionPreset("semaine");
                setOpen(false);
              }}
              label="Cette semaine"
              hint={weekHint}
            />
            <FilterRow
              checked={params.inscription === "mois"}
              onCheckboxToggle={() => {
                if (params.inscription === "mois") {
                  clearInscriptionFilter();
                } else {
                  selectInscriptionPreset("mois");
                }
              }}
              onRowSelect={() => {
                selectInscriptionPreset("mois");
                setOpen(false);
              }}
              label="Ce mois"
              hint={monthHint}
            />
            <InscriptionCustomRangeRow
              checked={isPersoActive}
              debut={params.inscriptionDebut ?? ""}
              fin={params.inscriptionFin ?? ""}
              onToggle={() => {
                if (isPersoActive) {
                  clearInscriptionFilter();
                } else {
                  navigate({
                    inscription: "perso",
                    inscriptionDebut: params.inscriptionDebut,
                    inscriptionFin: params.inscriptionFin,
                  });
                }
              }}
              onApply={(debut, fin) => {
                if (!debut && !fin) {
                  clearInscriptionFilter();
                  return;
                }
                if (!isValidInscriptionDateRange(debut, fin)) return;
                navigate({
                  inscription: "perso",
                  inscriptionDebut: debut || undefined,
                  inscriptionFin: fin || undefined,
                });
              }}
            />
          </FilterSection>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function InscriptionCustomRangeRow({
  checked,
  debut,
  fin,
  onToggle,
  onApply,
}: {
  checked: boolean;
  debut: string;
  fin: string;
  onToggle: () => void;
  onApply: (debut: string, fin: string) => void;
}) {
  const [localDebut, setLocalDebut] = useState(debut);
  const [localFin, setLocalFin] = useState(fin);

  useEffect(() => {
    setLocalDebut(debut);
  }, [debut]);

  useEffect(() => {
    setLocalFin(fin);
  }, [fin]);

  function applyDebut(value: string) {
    setLocalDebut(value);
    if (!isValidInscriptionDateRange(value, localFin)) return;
    onApply(value, localFin);
  }

  function applyFin(value: string) {
    setLocalFin(value);
    if (!isValidInscriptionDateRange(localDebut, value)) return;
    onApply(localDebut, value);
  }

  return (
    <div className="px-4 py-2.5 transition hover:bg-warm/60 md:py-2">
      <div className="flex items-start gap-3">
        <button
          type="button"
          role="checkbox"
          aria-checked={checked}
          aria-label="Période personnalisée"
          onClick={onToggle}
          className={cn(
            "mt-0.5 inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-sm border-2 transition md:size-5",
            checked
              ? "border-purple bg-purple text-white"
              : "border-border bg-surface text-transparent hover:border-purple/40",
          )}
        >
          <CheckGlyph />
        </button>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="text-sm font-medium text-text">
            Période personnalisée
          </span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="inscription-debut" className="text-xs text-subtle">
                Du
              </Label>
              <DatePickerField
                id="inscription-debut"
                value={localDebut}
                onChange={applyDebut}
                placeholder="Choisir une date"
                className="w-full px-2.5 py-1.5 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="inscription-fin" className="text-xs text-subtle">
                Au
              </Label>
              <DatePickerField
                id="inscription-fin"
                value={localFin}
                onChange={applyFin}
                minDate={localDebut || undefined}
                placeholder="Choisir une date"
                className="w-full px-2.5 py-1.5 text-xs"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
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
  hint,
}: {
  checked: boolean;
  onCheckboxToggle: () => void;
  onRowSelect: () => void;
  label: string;
  hint?: string;
}) {
  return (
    <div className="flex w-full items-center gap-3 px-4 py-2.5 transition hover:bg-warm/60 md:py-2">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={hint ? `${label} (${hint})` : label}
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
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left text-sm font-medium text-text"
      >
        <span className="min-w-0 flex-1 truncate">
          {label}
          {hint ? (
            <span className="text-xs font-medium text-subtle"> ({hint})</span>
          ) : null}
        </span>
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
