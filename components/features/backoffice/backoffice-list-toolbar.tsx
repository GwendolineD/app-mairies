"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils/cn";

type FilterOption = {
  value: string;
  label: string;
};

type QueryVariant = "communes" | "members";

const BUILD_QUERY_BY_VARIANT: Record<
  QueryVariant,
  (params: Record<string, string | number | undefined>) => string
> = {
  communes: buildBackofficeCommunesListQuery,
  members: buildBackofficeMembersListQuery,
};

type BackofficeListQueryProps = {
  params: Record<string, string | number | undefined>;
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

  function navigate(next: Record<string, string | number | undefined>) {
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

type FiltersProps = BackofficeListQueryProps & {
  searchPlaceholder?: string;
  statusOptions?: FilterOption[];
  roleOptions?: FilterOption[];
};

export function BackofficeListFilters({
  params,
  queryVariant,
  totalCount,
  pageSize,
  searchPlaceholder = "Rechercher…",
  statusOptions,
  roleOptions,
}: FiltersProps) {
  const { navigate } = useBackofficeListNavigation({
    params,
    queryVariant,
    totalCount,
    pageSize,
  });
  const [search, setSearch] = useState(String(params.q ?? ""));

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
        {statusOptions ? (
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
