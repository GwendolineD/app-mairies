"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DatePickerField } from "@/components/ui/date-picker-field";
import {
  FilterRow,
  FilterSection,
  FilterSheetTrigger,
} from "@/components/ui/filter-sheet";
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
import { MEMBERSHIP_ROLE_OPTIONS, ROLE_LABELS } from "@/lib/constants/roles";
import { MEMBERSHIP_STATUS } from "@/lib/constants/statuses";
import { resolveEndDateAfterStartChange } from "@/lib/datetime";
import type { PilotCommuneOption } from "@/lib/queries/backoffice-communes";
import {
  INVITATION_DERIVED_STATUS,
  INVITATION_DERIVED_STATUS_LABELS,
  type InvitationDerivedStatus,
} from "@/lib/utils/backoffice-invitations-params";
import {
  BACKOFFICE_UTILISATEURS_TABS,
  BACKOFFICE_UTILISATEURS_TAB_LABELS,
  activeBackofficeUtilisateursFilterCount,
  type BackofficeUtilisateursListParams,
  type BackofficeUtilisateursTab,
} from "@/lib/utils/backoffice-utilisateurs-params";
import { cn } from "@/lib/utils/cn";
import { useUtilisateursTabFilters } from "./use-utilisateurs-tab-filters";

type UtilisateursToolbarProps = {
  params: BackofficeUtilisateursListParams;
  communes: PilotCommuneOption[];
  totalCount?: number;
};

export function UtilisateursToolbar({
  params,
  communes,
  totalCount = 0,
}: UtilisateursToolbarProps) {
  const { navigate, switchTab } = useUtilisateursTabFilters(params);
  const [search, setSearch] = useState(params.q);
  const [desktopFiltersOpen, setDesktopFiltersOpen] = useState(false);

  function toggleInvitationStatus(status: InvitationDerivedStatus) {
    const next = params.invitationStatuses.includes(status)
      ? params.invitationStatuses.filter((value) => value !== status)
      : [...params.invitationStatuses, status];
    navigate({ invitationStatuses: next });
  }

  function toggleInvitationCommune(communeId: string) {
    const next = params.communes.includes(communeId)
      ? params.communes.filter((value) => value !== communeId)
      : [...params.communes, communeId];
    navigate({ communes: next });
  }

  useEffect(() => {
    setSearch(params.q);
  }, [params.q]);

  useEffect(() => {
    if (params.tab === "stats") return;

    const timeout = window.setTimeout(() => {
      if (search === params.q) return;
      navigate({ q: search || undefined });
    }, 300);

    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- navigate wraps router.push; adding it would reset debounce every render
  }, [search, params.q, params.tab]);

  function clearSearch() {
    setSearch("");
    navigate({ q: undefined });
  }

  const filterCount = activeBackofficeUtilisateursFilterCount(params);
  const { open, setOpen } = useFilterSheetState();

  function closeFilters() {
    setOpen(false);
    setDesktopFiltersOpen(false);
  }

  function clearAllFilters() {
    if (params.tab === "users") {
      navigate({
        commune: undefined,
        role: undefined,
        membershipStatus: undefined,
        banned: undefined,
        admin: undefined,
        dateFrom: undefined,
        dateTo: undefined,
      });
      return;
    }

    if (params.tab === "invitations") {
      navigate({
        communes: [],
        invitationStatuses: [],
        reminded: undefined,
        dateFrom: undefined,
        dateTo: undefined,
      });
    }
  }

  const usersFilterSections = (
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
                navigate({ commune: checked ? undefined : commune.id })
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

      <FilterSection title="Rôle">
        <FilterRow
          checked={!params.role}
          onCheckboxToggle={() => {
            if (!params.role) return;
            navigate({ role: undefined });
          }}
          onRowSelect={() => {
            navigate({ role: undefined });
            closeFilters();
          }}
          label="Tous les rôles"
        />
        {MEMBERSHIP_ROLE_OPTIONS.map((role) => {
          const checked = params.role === role;
          return (
            <FilterRow
              key={role}
              checked={checked}
              onCheckboxToggle={() =>
                navigate({ role: checked ? undefined : role })
              }
              onRowSelect={() => {
                navigate({ role });
                closeFilters();
              }}
              label={ROLE_LABELS[role]}
            />
          );
        })}
      </FilterSection>

      <FilterSection title="Statut adhésion">
        <FilterRow
          checked={!params.membershipStatus}
          onCheckboxToggle={() => {
            if (!params.membershipStatus) return;
            navigate({ membershipStatus: undefined });
          }}
          onRowSelect={() => {
            navigate({ membershipStatus: undefined });
            closeFilters();
          }}
          label="Tous les statuts"
        />
        {Object.values(MEMBERSHIP_STATUS).map((status) => {
          const checked = params.membershipStatus === status;
          return (
            <FilterRow
              key={status}
              checked={checked}
              onCheckboxToggle={() =>
                navigate({
                  membershipStatus: checked ? undefined : status,
                })
              }
              onRowSelect={() => {
                navigate({ membershipStatus: status });
                closeFilters();
              }}
              label={
                status === "active"
                  ? "Actif·ve"
                  : status === "suspended"
                    ? "Suspendu·e"
                    : "Parti·e"
              }
            />
          );
        })}
      </FilterSection>

      <FilterSection title="Compte">
        <FilterRow
          checked={params.banned === undefined}
          onCheckboxToggle={() => {
            if (params.banned === undefined) return;
            navigate({ banned: undefined });
          }}
          onRowSelect={() => {
            navigate({ banned: undefined });
            closeFilters();
          }}
          label="Tous les comptes"
        />
        <FilterRow
          checked={params.banned === true}
          onCheckboxToggle={() =>
            navigate({ banned: params.banned === true ? undefined : true })
          }
          onRowSelect={() => {
            navigate({ banned: true });
            closeFilters();
          }}
          label="Comptes bannis"
        />
        <FilterRow
          checked={params.banned === false}
          onCheckboxToggle={() =>
            navigate({ banned: params.banned === false ? undefined : false })
          }
          onRowSelect={() => {
            navigate({ banned: false });
            closeFilters();
          }}
          label="Comptes non bannis"
        />
      </FilterSection>

      <FilterSection title="Admin plateforme">
        <FilterRow
          checked={params.admin === undefined}
          onCheckboxToggle={() => {
            if (params.admin === undefined) return;
            navigate({ admin: undefined });
          }}
          onRowSelect={() => {
            navigate({ admin: undefined });
            closeFilters();
          }}
          label="Tous"
        />
        <FilterRow
          checked={params.admin === true}
          onCheckboxToggle={() =>
            navigate({ admin: params.admin === true ? undefined : true })
          }
          onRowSelect={() => {
            navigate({ admin: true });
            closeFilters();
          }}
          label="Admins plateforme"
        />
        <FilterRow
          checked={params.admin === false}
          onCheckboxToggle={() =>
            navigate({ admin: params.admin === false ? undefined : false })
          }
          onRowSelect={() => {
            navigate({ admin: false });
            closeFilters();
          }}
          label="Non admins"
        />
      </FilterSection>

      <FilterSection title="Inscription">
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
        <UtilisateursDateRangeFields
          dateFrom={params.dateFrom}
          dateTo={params.dateTo}
          onChange={(dateFrom, dateTo) => navigate({ dateFrom, dateTo })}
        />
      </FilterSection>
    </>
  );

  const invitationsFilterSections = (
    <>
      <FilterSection title="Commune">
        <FilterRow
          checked={params.communes.length === 0}
          onCheckboxToggle={() => {
            if (params.communes.length === 0) return;
            navigate({ communes: [] });
          }}
          onRowSelect={() => {
            navigate({ communes: [] });
            closeFilters();
          }}
          label="Toutes les communes"
        />
        {communes.map((commune) => {
          const label = commune.postcode
            ? `${commune.name} (${commune.postcode})`
            : commune.name;
          const checked = params.communes.includes(commune.id);
          return (
            <FilterRow
              key={commune.id}
              checked={checked}
              onCheckboxToggle={() => toggleInvitationCommune(commune.id)}
              onRowSelect={() => {
                navigate({ communes: [commune.id] });
                closeFilters();
              }}
              label={label}
            />
          );
        })}
      </FilterSection>

      <FilterSection title="Statut invitation">
        <FilterRow
          checked={params.invitationStatuses.length === 0}
          onCheckboxToggle={() => {
            if (params.invitationStatuses.length === 0) return;
            navigate({ invitationStatuses: [] });
          }}
          onRowSelect={() => {
            navigate({ invitationStatuses: [] });
            closeFilters();
          }}
          label="Tous les statuts"
        />
        {Object.values(INVITATION_DERIVED_STATUS).map((status) => {
          const checked = params.invitationStatuses.includes(status);
          return (
            <FilterRow
              key={status}
              checked={checked}
              onCheckboxToggle={() => toggleInvitationStatus(status)}
              onRowSelect={() => {
                navigate({ invitationStatuses: [status] });
                closeFilters();
              }}
              label={INVITATION_DERIVED_STATUS_LABELS[status]}
            />
          );
        })}
      </FilterSection>

      <FilterSection title="Relance">
        <FilterRow
          checked={params.reminded === undefined}
          onCheckboxToggle={() => {
            if (params.reminded === undefined) return;
            navigate({ reminded: undefined });
          }}
          onRowSelect={() => {
            navigate({ reminded: undefined });
            closeFilters();
          }}
          label="Toutes"
        />
        <FilterRow
          checked={params.reminded === true}
          onCheckboxToggle={() =>
            navigate({ reminded: params.reminded === true ? undefined : true })
          }
          onRowSelect={() => {
            navigate({ reminded: true });
            closeFilters();
          }}
          label="Relance envoyée"
        />
        <FilterRow
          checked={params.reminded === false}
          onCheckboxToggle={() =>
            navigate({
              reminded: params.reminded === false ? undefined : false,
            })
          }
          onRowSelect={() => {
            navigate({ reminded: false });
            closeFilters();
          }}
          label="Sans relance"
        />
      </FilterSection>

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
        <UtilisateursDateRangeFields
          dateFrom={params.dateFrom}
          dateTo={params.dateTo}
          onChange={(dateFrom, dateTo) => navigate({ dateFrom, dateTo })}
        />
      </FilterSection>
    </>
  );

  const filterSections =
    params.tab === "users"
      ? usersFilterSections
      : params.tab === "invitations"
        ? invitationsFilterSections
        : null;

  return (
    <div className="flex flex-col gap-4">
      <nav className="flex gap-1 overflow-x-auto border-b border-border">
        {BACKOFFICE_UTILISATEURS_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={params.tab === tab}
            onClick={() => switchTab(tab)}
            className={cn(
              "shrink-0 cursor-pointer px-3 py-2 text-sm font-semibold transition",
              params.tab === tab
                ? "border-b-2 border-purple text-purple"
                : "text-muted hover:text-text",
            )}
          >
            {BACKOFFICE_UTILISATEURS_TAB_LABELS[tab]}
          </button>
        ))}
      </nav>

      {params.tab !== "stats" ? (
        <div className="flex min-w-0 items-center gap-2">
          <div className="relative min-w-0 flex-1 max-w-md">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={
                params.tab === "users"
                  ? "Rechercher par nom ou prénom"
                  : "Rechercher par email"
              }
              className="rounded-sm pr-9 placeholder:text-xs md:placeholder:text-sm"
              aria-label={
                params.tab === "users"
                  ? "Rechercher par nom ou prénom"
                  : "Rechercher par email"
              }
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

function UtilisateursDateRangeFields({
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
        <Label htmlFor="utilisateurs-date-from" className="text-xs text-subtle">
          Date de début
        </Label>
        <DatePickerField
          id="utilisateurs-date-from"
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
        <Label htmlFor="utilisateurs-date-to" className="text-xs text-subtle">
          Date de fin
        </Label>
        <DatePickerField
          id="utilisateurs-date-to"
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
