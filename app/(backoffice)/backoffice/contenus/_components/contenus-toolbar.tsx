"use client";

import { Check, ChevronDown, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DatePickerField } from "@/components/ui/date-picker-field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { resolveEndDateAfterStartChange } from "@/lib/datetime";
import type { PilotCommuneOption } from "@/lib/queries/backoffice-communes";
import type { ContentCategoryOption } from "@/lib/queries/backoffice-contenus";
import {
  BACKOFFICE_CONTENT_SORT,
  BACKOFFICE_CONTENT_STATUSES,
  BACKOFFICE_CONTENT_STATUS_LABELS,
  BACKOFFICE_CONTENT_SUBTYPES,
  BACKOFFICE_CONTENT_TYPES,
  BACKOFFICE_CONTENT_TYPE_LABELS,
  buildBackofficeContenusListQuery,
  type BackofficeContenusListParams,
  type BackofficeContentStatus,
  type BackofficeContentType,
} from "@/lib/utils/backoffice-contenus-params";
import { cn } from "@/lib/utils/cn";

type ContenusToolbarProps = {
  params: BackofficeContenusListParams;
  communes: PilotCommuneOption[];
  categories: ContentCategoryOption[];
};

function multiSelectLabel(
  selected: string[],
  options: { value: string; label: string }[],
  emptyLabel: string,
): string {
  if (selected.length === 0) return emptyLabel;
  if (selected.length === 1) {
    const match = options.find((option) => option.value === selected[0]);
    return match?.label ?? emptyLabel;
  }
  return `${selected.length} sélectionnés`;
}

function MultiSelectOption({
  label,
  checked,
  onToggle,
  onSelectOnly,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  onSelectOnly: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-sm px-1.5 py-1 text-sm font-medium hover:bg-warm">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={`${checked ? "Retirer" : "Ajouter"} ${label}`}
        onPointerDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onToggle();
        }}
        className={cn(
          "flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-sm border border-border bg-surface transition",
          checked && "border-purple bg-purple text-white",
        )}
      >
        {checked ? <Check className="size-3" aria-hidden /> : null}
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onSelectOnly();
        }}
        className="min-w-0 flex-1 cursor-pointer truncate text-left text-text"
      >
        {label}
      </button>
    </div>
  );
}

export function ContenusToolbar({
  params,
  communes,
  categories,
}: ContenusToolbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(params.q);
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  const typeOptions = BACKOFFICE_CONTENT_TYPES.map((type) => ({
    value: type,
    label: BACKOFFICE_CONTENT_TYPE_LABELS[type],
  }));

  const statusOptions = BACKOFFICE_CONTENT_STATUSES.map((status) => ({
    value: status,
    label: BACKOFFICE_CONTENT_STATUS_LABELS[status],
  }));

  const showSubtypeFilter = params.types.includes("announcement");
  const showOfficialFilter = params.types.includes("event");

  function navigate(next: Partial<BackofficeContenusListParams>) {
    startTransition(() => {
      router.push(
        `${pathname}${buildBackofficeContenusListQuery({ ...params, page: 1, ...next })}`,
      );
    });
  }

  useEffect(() => {
    setSearch(params.q);
  }, [params.q]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (search === params.q) return;
      navigate({ q: search || undefined });
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [search, params.q]);

  function clearSearch() {
    setSearch("");
    navigate({ q: undefined });
  }

  function toggleType(type: BackofficeContentType) {
    const next = params.types.includes(type)
      ? params.types.filter((value) => value !== type)
      : [...params.types, type];
    navigate({
      types: next.length > 0 ? next : ["announcement"],
      subtype: next.includes("announcement") ? params.subtype : undefined,
      official: next.includes("event") ? params.official : undefined,
    });
  }

  function toggleStatus(status: BackofficeContentStatus) {
    const next = params.statuses.includes(status)
      ? params.statuses.filter((value) => value !== status)
      : [...params.statuses, status];
    navigate({ statuses: next });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative max-w-md w-full">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher par titre"
          className="rounded-sm pr-9"
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

      <div className="flex flex-wrap items-center gap-2">
        <Popover open={typeMenuOpen} onOpenChange={setTypeMenuOpen}>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="min-w-40 justify-between rounded-sm"
              />
            }
          >
            {multiSelectLabel(
              params.types,
              typeOptions,
              "Types de contenu",
            )}
            <ChevronDown className="size-4 text-muted" aria-hidden />
          </PopoverTrigger>
          <PopoverContent align="start" className="w-44 rounded-sm p-1">
            {typeOptions.map((option) => (
              <MultiSelectOption
                key={option.value}
                label={option.label}
                checked={params.types.includes(option.value)}
                onToggle={() => toggleType(option.value)}
                onSelectOnly={() => {
                  navigate({ types: [option.value] });
                  setTypeMenuOpen(false);
                }}
              />
            ))}
          </PopoverContent>
        </Popover>

        <Select
          items={[
            { value: "all", label: "Toutes les communes" },
            ...communes.map((commune) => ({
              value: commune.id,
              label: commune.postcode
                ? `${commune.name} (${commune.postcode})`
                : commune.name,
            })),
          ]}
          value={params.commune ?? "all"}
          onValueChange={(value) => {
            if (!value || value === "all") {
              navigate({ commune: undefined });
              return;
            }
            navigate({ commune: value });
          }}
        >
          <SelectTrigger className="min-w-44 rounded-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les communes</SelectItem>
            {communes.map((commune) => (
              <SelectItem key={commune.id} value={commune.id}>
                {commune.postcode
                  ? `${commune.name} (${commune.postcode})`
                  : commune.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover open={statusMenuOpen} onOpenChange={setStatusMenuOpen}>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="min-w-36 justify-between rounded-sm"
              />
            }
          >
            {multiSelectLabel(
              params.statuses,
              statusOptions,
              "Tous les statuts",
            )}
            <ChevronDown className="size-4 text-muted" aria-hidden />
          </PopoverTrigger>
          <PopoverContent align="start" className="w-44 rounded-sm p-1">
            {statusOptions.map((option) => (
              <MultiSelectOption
                key={option.value}
                label={option.label}
                checked={params.statuses.includes(option.value)}
                onToggle={() => toggleStatus(option.value)}
                onSelectOnly={() => {
                  navigate({ statuses: [option.value] });
                  setStatusMenuOpen(false);
                }}
              />
            ))}
          </PopoverContent>
        </Popover>

        <Select
          items={[
            { value: "all", label: "Modération : toutes" },
            { value: "true", label: "Suspendus uniquement" },
            { value: "false", label: "Non suspendus" },
          ]}
          value={
            params.suspended === true
              ? "true"
              : params.suspended === false
                ? "false"
                : "all"
          }
          onValueChange={(value) => {
            if (!value || value === "all") {
              navigate({ suspended: undefined });
              return;
            }
            navigate({ suspended: value === "true" });
          }}
        >
          <SelectTrigger className="min-w-44 rounded-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Modération : toutes</SelectItem>
            <SelectItem value="true">Suspendus uniquement</SelectItem>
            <SelectItem value="false">Non suspendus</SelectItem>
          </SelectContent>
        </Select>

        {showSubtypeFilter ? (
          <Select
            items={[
              { value: "all", label: "Tous les sous-types" },
              ...BACKOFFICE_CONTENT_SUBTYPES.map((subtype) => ({
                value: subtype,
                label: subtype === "demande" ? "Demande" : "Offre",
              })),
            ]}
            value={params.subtype ?? "all"}
            onValueChange={(value) => {
              if (!value || value === "all") {
                navigate({ subtype: undefined });
                return;
              }
              navigate({
                subtype: value as BackofficeContenusListParams["subtype"],
              });
            }}
          >
            <SelectTrigger className="min-w-40 rounded-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les sous-types</SelectItem>
              <SelectItem value="demande">Demande</SelectItem>
              <SelectItem value="offre">Offre</SelectItem>
            </SelectContent>
          </Select>
        ) : null}

        {categories.length > 0 ? (
          <Select
            items={[
              { value: "all", label: "Toutes catégories" },
              ...categories.map((category) => ({
                value: category.slug,
                label: category.label,
              })),
            ]}
            value={params.category ?? "all"}
            onValueChange={(value) => {
              if (!value || value === "all") {
                navigate({ category: undefined });
                return;
              }
              navigate({ category: value });
            }}
          >
            <SelectTrigger className="min-w-40 rounded-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={`${category.contentType}:${category.slug}`} value={category.slug}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        {showOfficialFilter ? (
          <Select
            items={[
              { value: "all", label: "Événements : tous" },
              { value: "true", label: "Officiels mairie" },
              { value: "false", label: "Communautaires" },
            ]}
            value={
              params.official === true
                ? "true"
                : params.official === false
                  ? "false"
                  : "all"
            }
            onValueChange={(value) => {
              if (!value || value === "all") {
                navigate({ official: undefined });
                return;
              }
              navigate({ official: value === "true" });
            }}
          >
            <SelectTrigger className="min-w-44 rounded-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Événements : tous</SelectItem>
              <SelectItem value="true">Officiels mairie</SelectItem>
              <SelectItem value="false">Communautaires</SelectItem>
            </SelectContent>
          </Select>
        ) : null}

        <DatePickerField
          value={params.dateFrom ?? ""}
          onChange={(value) =>
            navigate({
              dateFrom: value || undefined,
              dateTo: params.dateTo
                ? resolveEndDateAfterStartChange(value, params.dateTo)
                : undefined,
            })
          }
          maxDate={params.dateTo}
          placeholder="Date de début"
          className="w-40"
          aria-label="Date de début"
        />

        <DatePickerField
          value={params.dateTo ?? ""}
          onChange={(value) => navigate({ dateTo: value || undefined })}
          minDate={params.dateFrom}
          placeholder="Date de fin"
          className="w-40"
          aria-label="Date de fin"
        />

        <Select
          items={[
            { value: BACKOFFICE_CONTENT_SORT.newest, label: "Plus récents" },
            { value: BACKOFFICE_CONTENT_SORT.oldest, label: "Plus anciens" },
          ]}
          value={params.sort}
          onValueChange={(value) => {
            if (!value) return;
            navigate({
              sort: value as BackofficeContenusListParams["sort"],
            });
          }}
        >
          <SelectTrigger className="min-w-36 rounded-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={BACKOFFICE_CONTENT_SORT.newest}>
              Plus récents
            </SelectItem>
            <SelectItem value={BACKOFFICE_CONTENT_SORT.oldest}>
              Plus anciens
            </SelectItem>
          </SelectContent>
        </Select>

        {isPending ? (
          <span className="text-xs font-medium text-muted">Mise à jour…</span>
        ) : null}
      </div>
    </div>
  );
}
