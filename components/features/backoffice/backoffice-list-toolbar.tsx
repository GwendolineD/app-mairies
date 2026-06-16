"use client";

import Link from "next/link";
import { Check, ChevronDown, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  buildBackofficeCommunesListQuery,
  buildBackofficeMembersListQuery,
} from "@/lib/utils/backoffice-search-params";
import type { AccessStatus } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

type FilterOption = {
  value: string;
  label: string;
};

type QueryVariant = "communes" | "members";

type BackofficeListParams = Record<
  string,
  string | number | string[] | undefined
>;

const BUILD_QUERY_BY_VARIANT: Record<
  QueryVariant,
  (params: BackofficeListParams) => string
> = {
  communes: buildBackofficeCommunesListQuery,
  members: buildBackofficeMembersListQuery,
};

type BackofficeListQueryProps = {
  params: BackofficeListParams;
  queryVariant: QueryVariant;
  totalCount: number;
  pageSize: number;
  limitOptions?: readonly number[];
};

function useBackofficeListNavigation({
  params,
  queryVariant,
  totalCount,
  pageSize,
}: BackofficeListQueryProps) {
  const buildQuery = BUILD_QUERY_BY_VARIANT[queryVariant];
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const page = Number(params.page ?? 1);
  const limit = Number(params.limit ?? pageSize);
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  function navigate(next: BackofficeListParams) {
    startTransition(() => {
      router.push(`${pathname}${buildQuery({ ...params, page: 1, ...next })}`);
    });
  }

  return {
    navigate,
    isPending,
    page,
    limit,
    totalPages,
  };
}

function statusFilterLabel(
  selectedStatuses: string[],
  statusOptions: FilterOption[],
): string {
  if (selectedStatuses.length === 0) return "Tous les statuts";
  if (selectedStatuses.length === 1) {
    const match = statusOptions.find(
      (option) => option.value === selectedStatuses[0],
    );
    return match?.label ?? "Tous les statuts";
  }
  return `${selectedStatuses.length} statuts`;
}

function StatusMultiSelectOption({
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

type FiltersProps = BackofficeListQueryProps & {
  searchPlaceholder?: string;
  statusOptions?: FilterOption[];
  statusMultiSelect?: boolean;
  roleOptions?: FilterOption[];
};

export function BackofficeListFilters({
  params,
  queryVariant,
  totalCount,
  pageSize,
  searchPlaceholder = "Rechercher…",
  statusOptions,
  statusMultiSelect = false,
  roleOptions,
}: FiltersProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [, startStatusTransition] = useTransition();
  const { navigate } = useBackofficeListNavigation({
    params,
    queryVariant,
    totalCount,
    pageSize,
  });
  const [search, setSearch] = useState(String(params.q ?? ""));
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  const urlStatuses = Array.isArray(params.statuses)
    ? params.statuses.map(String)
    : params.status
      ? [String(params.status)]
      : [];

  const [localStatuses, setLocalStatuses] = useState<string[]>(urlStatuses);

  useEffect(() => {
    setLocalStatuses(urlStatuses);
  }, [urlStatuses.join(",")]);

  function navigateStatuses(nextStatuses: AccessStatus[]) {
    setLocalStatuses(nextStatuses);
    startStatusTransition(() => {
      router.push(
        `${pathname}${buildBackofficeCommunesListQuery({
          q: String(params.q ?? "") || undefined,
          statuses: nextStatuses,
          page: 1,
          limit: Number(params.limit ?? pageSize),
        })}`,
      );
    });
  }

  useEffect(() => {
    setSearch(String(params.q ?? ""));
  }, [params.q]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const current = String(params.q ?? "");
      if (search === current) return;
      navigate({ q: search || undefined });
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [search, params.q]);

  function clearSearch() {
    setSearch("");
    navigate({ q: undefined });
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative max-w-md w-full">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={searchPlaceholder}
          className="rounded-sm pr-9"
          aria-label={searchPlaceholder}
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
        {statusOptions && statusMultiSelect ? (
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
              {statusFilterLabel(localStatuses, statusOptions)}
              <ChevronDown className="size-4 text-muted" aria-hidden />
            </PopoverTrigger>
            <PopoverContent align="end" className="w-36 rounded-sm p-1">
              {statusOptions.map((option) => (
                <StatusMultiSelectOption
                  key={option.value}
                  label={option.label}
                  checked={localStatuses.includes(option.value)}
                  onToggle={() => {
                    const next = localStatuses.includes(option.value)
                      ? localStatuses.filter((value) => value !== option.value)
                      : [...localStatuses, option.value];
                    navigateStatuses(next as AccessStatus[]);
                  }}
                  onSelectOnly={() => {
                    navigateStatuses([option.value as AccessStatus]);
                    setStatusMenuOpen(false);
                  }}
                />
              ))}
            </PopoverContent>
          </Popover>
        ) : null}

        {statusOptions && !statusMultiSelect ? (
          <Select
            items={[
              { value: "all", label: "Tous les statuts" },
              ...statusOptions.map((option) => ({
                value: option.value,
                label: option.label,
              })),
            ]}
            value={String(params.status ?? "all")}
            onValueChange={(value) => {
              if (!value || value === "all") {
                navigate({ status: undefined });
                return;
              }
              navigate({ status: value });
            }}
          >
            <SelectTrigger className="min-w-36 rounded-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        {roleOptions ? (
          <Select
            items={[
              { value: "all", label: "Tous les rôles" },
              ...roleOptions.map((option) => ({
                value: option.value,
                label: option.label,
              })),
            ]}
            value={String(params.role ?? "all")}
            onValueChange={(value) => {
              if (!value || value === "all") {
                navigate({ role: undefined });
                return;
              }
              navigate({ role: value });
            }}
          >
            <SelectTrigger className="min-w-36 rounded-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les rôles</SelectItem>
              {roleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>
    </div>
  );
}

export function BackofficeListResultCount({
  params,
  queryVariant,
  totalCount,
  pageSize,
}: BackofficeListQueryProps) {
  const { isPending } = useBackofficeListNavigation({
    params,
    queryVariant,
    totalCount,
    pageSize,
  });

  return (
    <p className="text-sm font-medium text-muted">
      {totalCount} résultat{totalCount > 1 ? "s" : ""}
      {isPending ? " · mise à jour…" : null}
    </p>
  );
}

type PaginationProps = BackofficeListQueryProps & {
  limitOptions?: readonly number[];
};

export function BackofficeListPagination({
  params,
  queryVariant,
  totalCount,
  pageSize,
  limitOptions = [10, 25, 50],
}: PaginationProps) {
  const { navigate, page, limit, totalPages } = useBackofficeListNavigation({
    params,
    queryVariant,
    totalCount,
    pageSize,
  });

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 text-sm font-medium text-muted">
        <Select
          items={limitOptions.map((option) => ({
            value: String(option),
            label: `${option} / page`,
          }))}
          value={String(limit)}
          onValueChange={(value) => {
            if (!value) return;
            navigate({ limit: Number(value), page: 1 });
          }}
        >
          <SelectTrigger className="min-w-28 rounded-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {limitOptions.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option} / page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {totalPages > 1 ? (
          <nav className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              className="px-3 py-1.5 text-xs"
              disabled={page <= 1}
              onClick={() => navigate({ page: page - 1 })}
            >
              Précédent
            </Button>
            <span>
              Page {page} / {totalPages}
            </span>
            <Button
              type="button"
              variant="secondary"
              className="px-3 py-1.5 text-xs"
              disabled={page >= totalPages}
              onClick={() => navigate({ page: page + 1 })}
            >
              Suivant
            </Button>
          </nav>
        ) : null}
    </div>
  );
}

type ListField = {
  label: string;
  value: React.ReactNode;
};

export function BackofficeListLinkCard({
  href,
  title,
  titleAside,
  fields,
  metaTrailing,
  className,
}: {
  href: string;
  title: React.ReactNode;
  titleAside?: React.ReactNode;
  fields: ListField[];
  metaTrailing?: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "block cursor-pointer rounded-2xl border border-border/60 bg-surface px-4 py-4 transition hover:bg-warm",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-base font-semibold text-text">{title}</p>
        {titleAside}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium text-muted">
          {fields.map((field) => (
            <p key={field.label}>
              <span className="text-subtle">{field.label}</span>
              {" · "}
              <span className="text-text">{field.value}</span>
            </p>
          ))}
        </div>

        {metaTrailing ? (
          <p className="ml-auto shrink-0 text-right text-xs font-medium text-muted">
            {metaTrailing}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
