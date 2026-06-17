"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpDown, ChevronDown, List, Map, Plus, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import {
  INITIATIVE_CATEGORIES,
  getInitiativeCategoryColorHex,
} from "@/lib/constants/initiative-categories";
import type { LucideIcon } from "@/lib/utils/lucide-icon-map";
import {
  buildInitiativeListQuery,
  type InitiativeListParams,
  type SortMode,
} from "@/lib/utils/search-params";
import { Button } from "@/components/ui/button";
import { CategoryIconBadge } from "@/components/ui/category-icon-badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils/cn";

type Props = {
  params: InitiativeListParams;
  totalCount: number;
  onCreateClick?: () => void;
};

export function InitiativeListToolbar({
  params,
  totalCount,
  onCreateClick,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function navigate(partial: Partial<InitiativeListParams>) {
    const next = { ...params, ...partial, page: partial.page ?? 1 };
    router.push(`${pathname}${buildInitiativeListQuery(next)}`);
  }

  const filterCount = params.categorie ? 1 : 0;
  const countLabel = `${totalCount} initiative${totalCount !== 1 ? "s" : ""} près de chez vous`;

  const createButtonMobile = onCreateClick ? (
    <Button
      type="button"
      variant="primary"
      size="icon-sm"
      onClick={onCreateClick}
      aria-label="Lancer une initiative"
      className="size-[34px] shrink-0 p-0 md:hidden"
    >
      <Plus aria-hidden />
    </Button>
  ) : (
    <Button
      href={`${pathname}${buildInitiativeListQuery({ ...params, create: "initiative" })}`}
      size="icon-sm"
      aria-label="Lancer une initiative"
      className="size-[34px] shrink-0 p-0 md:hidden"
    >
      <Plus aria-hidden />
    </Button>
  );

  const createButtonDesktop = onCreateClick ? (
    <Button type="button" variant="primary" size="sm" onClick={onCreateClick}>
      <span className="text-sm leading-none">+</span>
      <span>Lancer une initiative</span>
    </Button>
  ) : (
    <Button
      href={`${pathname}${buildInitiativeListQuery({ ...params, create: "initiative" })}`}
      size="sm"
    >
      <span className="text-sm leading-none">+</span>
      <span>Lancer une initiative</span>
    </Button>
  );

  const viewToggle = (
    <div className="inline-flex rounded-sm border border-border bg-surface p-0.5">
      <ViewToggle
        active={params.vue === "liste"}
        onClick={() => navigate({ vue: "liste" })}
        icon={<List className="size-3.5" aria-hidden />}
        label="Vue liste"
      />
      <ViewToggle
        active={params.vue === "carte"}
        onClick={() => navigate({ vue: "carte" })}
        icon={<Map className="size-3.5" aria-hidden />}
        label="Vue carte"
      />
    </div>
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold leading-7 text-text md:hidden">
        Toutes les initiatives
      </h1>

      <div className="hidden flex-wrap items-start justify-between gap-3 md:flex">
        <div className="space-y-1">
          <h1 className="text-[28px] font-bold leading-9 text-text">
            Toutes les initiatives
          </h1>
          <p className="text-sm font-medium leading-5 text-muted">
            Découvrez les idées proposées par les habitants pour faire évoluer la commune.
          </p>
        </div>
        {createButtonDesktop}
      </div>

      <div className="flex items-center justify-between gap-3 md:hidden">
        {viewToggle}
        {createButtonMobile}
      </div>

      <div className="hidden flex-wrap items-center justify-between gap-3 md:flex">
        {viewToggle}
        <div className="flex items-center gap-2">
          <SortPopover params={params} navigate={navigate} />
          <CategoryFiltersPopover
            params={params}
            navigate={navigate}
            count={filterCount}
          />
        </div>
      </div>

      <p className="hidden text-xs font-medium text-muted md:block">{countLabel}</p>

      <div className="flex justify-end md:hidden">
        <div className="flex items-center gap-2">
          <SortPopover params={params} navigate={navigate} />
          <CategoryFiltersPopover
            params={params}
            navigate={navigate}
            count={filterCount}
          />
        </div>
      </div>

      <p className="text-xs font-medium text-muted md:hidden">{countLabel}</p>
    </div>
  );
}

function ViewToggle({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-xs font-semibold transition",
        active ? "bg-soft-pink text-purple" : "text-muted hover:text-text",
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "recent", label: "Les plus récentes" },
  { value: "oldest", label: "Les plus anciennes" },
];

function SortPopover({
  params,
  navigate,
}: {
  params: InitiativeListParams;
  navigate: (partial: Partial<InitiativeListParams>) => void;
}) {
  const [open, setOpen] = useState(false);
  const currentLabel =
    SORT_OPTIONS.find((o) => o.value === params.tri)?.label ?? "Trier par";

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
        className="z-1200 w-48 rounded-sm border border-border bg-surface p-1 shadow-card"
      >
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              navigate({ tri: opt.value });
              setOpen(false);
            }}
            className={cn(
              "flex w-full cursor-pointer items-center rounded-sm px-3 py-2 text-xs font-medium transition",
              params.tri === opt.value
                ? "bg-soft-pink text-purple"
                : "text-text hover:bg-warm",
            )}
          >
            {opt.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function CategoryFiltersPopover({
  params,
  navigate,
  count,
}: {
  params: InitiativeListParams;
  navigate: (partial: Partial<InitiativeListParams>) => void;
  count: number;
}) {
  const [open, setOpen] = useState(false);

  function clearAll() {
    navigate({ categorie: undefined });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={cn(
              "relative inline-flex cursor-pointer items-center gap-1.5 rounded-sm border bg-surface px-2.5 py-1.5 text-xs font-semibold transition hover:border-purple/30",
              count > 0 ? "border-purple/40 text-purple" : "border-border text-muted",
            )}
          >
            <SlidersHorizontal className="size-3.5" aria-hidden />
            <span>Filtres</span>
            {count > 0 ? (
              <span className="inline-flex size-4 items-center justify-center rounded-full bg-purple text-[10px] font-bold text-white">
                {count}
              </span>
            ) : null}
            <ChevronDown className="size-3.5" aria-hidden />
          </button>
        }
      />
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(92vw,360px)] gap-0 p-0"
      >
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <h2 className="text-sm font-bold text-text">Filtres</h2>
          <div className="flex items-center gap-1">
            {count > 0 ? (
              <button
                type="button"
                onClick={clearAll}
                className="cursor-pointer text-xs font-semibold text-muted hover:text-text"
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

        <section className="py-2">
          <h3 className="px-4 pb-1 pt-2 text-[11px] font-bold uppercase tracking-widest text-muted">
            Catégorie
          </h3>
          <div className="flex flex-col">
            <FilterRow
              checked={!params.categorie}
              onCheckboxToggle={() => navigate({ categorie: undefined })}
              onRowSelect={() => {
                navigate({ categorie: undefined });
                setOpen(false);
              }}
              label="Toutes les catégories"
            />
            {INITIATIVE_CATEGORIES.map((c) => {
              const checked = params.categorie === c.slug;
              return (
                <FilterRow
                  key={c.slug}
                  checked={checked}
                  colorHex={getInitiativeCategoryColorHex(c.slug)}
                  icon={c.Icon}
                  onCheckboxToggle={() =>
                    navigate({ categorie: checked ? undefined : c.slug })
                  }
                  onRowSelect={() => {
                    navigate({ categorie: c.slug });
                    setOpen(false);
                  }}
                  label={c.label}
                />
              );
            })}
          </div>
        </section>
      </PopoverContent>
    </Popover>
  );
}

function FilterRow({
  checked,
  onCheckboxToggle,
  onRowSelect,
  label,
  colorHex,
  icon: Icon,
}: {
  checked: boolean;
  onCheckboxToggle: () => void;
  onRowSelect: () => void;
  label: string;
  colorHex?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex w-full items-center gap-3 px-4 py-2.5 transition hover:bg-warm/60 md:py-2">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={label}
        onClick={(e) => {
          e.stopPropagation();
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
        {Icon && colorHex ? (
          <CategoryIconBadge colorHex={colorHex} Icon={Icon} />
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

export function InitiativePagination({
  params,
  totalCount,
  pageSize,
}: {
  params: InitiativeListParams;
  totalCount: number;
  pageSize: number;
}) {
  const pathname = usePathname();
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  if (totalPages <= 1) return null;

  return (
    <nav className="hidden items-center justify-center gap-2 md:flex">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <Link
          key={page}
          href={`${pathname}${buildInitiativeListQuery({ ...params, page })}`}
          className={cn(
            "cursor-pointer rounded-sm px-3 py-1.5 text-sm font-semibold",
            page === params.page
              ? "bg-soft-pink text-purple"
              : "text-muted hover:text-text",
          )}
        >
          {page}
        </Link>
      ))}
    </nav>
  );
}
