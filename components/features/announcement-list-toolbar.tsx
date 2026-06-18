"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpDown, Calendar as CalendarIcon, ChevronDown, List, Map, Plus, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { format, isValid, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { ANNOUNCEMENT_CATEGORIES } from "@/lib/constants/announcement-categories";
import { ANNOUNCEMENT_TYPES } from "@/lib/constants/announcement-types";
import {
  buildAnnouncementListQuery,
  type AnnouncementDateFilter,
  type AnnouncementListParams,
  type SortMode,
} from "@/lib/utils/search-params";
import { Button } from "@/components/ui/button";
import { CategoryIconBadge } from "@/components/ui/category-icon-badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { LucideIcon } from "@/lib/utils/lucide-icon-map";
import { cn } from "@/lib/utils/cn";
import { InfoPopover } from "@/components/features/onboarding/info-popover";
import { FilterHelpPopover } from "@/components/ui/filter-help-popover";

type Props = {
  params: AnnouncementListParams;
  totalCount: number;
  onCreateClick?: () => void;
};

function activeFilterCount(params: AnnouncementListParams): number {
  let n = 0;
  if (params.type) n += 1;
  if (params.categories.length > 0) n += params.categories.length;
  if (params.date) n += 1;
  return n;
}

export function AnnouncementListToolbar({
  params,
  totalCount,
  onCreateClick,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function navigate(partial: Partial<AnnouncementListParams>) {
    const next = { ...params, ...partial, page: partial.page ?? 1 };
    router.push(`${pathname}${buildAnnouncementListQuery(next)}`);
  }

  const filterCount = activeFilterCount(params);

  const countLabel = `${totalCount} annonce${totalCount !== 1 ? "s" : ""} près de chez vous`;

  const createButtonMobile = onCreateClick ? (
    <Button
      type="button"
      variant="primary"
      size="icon-sm"
      onClick={onCreateClick}
      aria-label="Créer une annonce"
      className="size-[34px] shrink-0 p-0 md:hidden"
    >
      <Plus aria-hidden />
    </Button>
  ) : (
    <Button
      href={`${pathname}${buildAnnouncementListQuery({ ...params, create: "annonce" })}`}
      size="icon-sm"
      aria-label="Créer une annonce"
      className="size-[34px] shrink-0 p-0 md:hidden"
    >
      <Plus aria-hidden />
    </Button>
  );

  const createButtonDesktop = onCreateClick ? (
    <Button
      type="button"
      variant="primary"
      size="sm"
      className="font-bold"
      onClick={onCreateClick}
    >
      <span className="text-sm leading-none">+</span>
      <span>Créer une annonce</span>
    </Button>
  ) : (
    <Button
      href={`${pathname}${buildAnnouncementListQuery({ ...params, create: "annonce" })}`}
      size="sm"
      className="font-bold"
    >
      <span className="text-sm leading-none">+</span>
      <span>Créer une annonce</span>
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

  const sortAndFilters = (
    <div className="flex items-center gap-2">
      <SortPopover params={params} navigate={navigate} />
      <FiltersPopover params={params} navigate={navigate} count={filterCount} />
    </div>
  );

  return (
    <div className="space-y-2 md:space-y-4">
      {/* Mobile: title only */}
      <div className="flex items-center gap-2 md:hidden">
        <h1 className="text-xl font-bold leading-7 text-text">
          Toutes les annonces
        </h1>
        <InfoPopover slide="annonces" />
      </div>

      {/* Desktop: title, subtitle and full create button */}
      <div className="mb-3 hidden flex-wrap items-start justify-between gap-3 md:flex">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-[28px] font-bold leading-9 text-text">
              Toutes les annonces
            </h1>
            <InfoPopover slide="annonces" />
          </div>
          <p className="text-sm font-medium leading-5 text-muted">
            Retrouvez toutes les demandes et propositions d&apos;entraide près de chez vous
          </p>
        </div>
        {createButtonDesktop}
      </div>

      {/* Mobile: view toggle + create button */}
      <div className="flex items-center justify-between gap-3 md:hidden">
        {viewToggle}
        {createButtonMobile}
      </div>

      {/* Desktop: view toggle + sort/filters */}
      <div className="hidden flex-wrap items-center justify-between gap-3 md:flex">
        {viewToggle}
        {sortAndFilters}
      </div>

      <p className="mb-0 mt-[15px] hidden text-xs font-medium text-muted md:block">{countLabel}</p>

      {/* Mobile: sort/filters aligned right */}
      <div className="flex justify-end md:hidden">{sortAndFilters}</div>

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
        active
          ? "bg-soft-pink text-purple"
          : "text-muted hover:text-text",
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
  params: AnnouncementListParams;
  navigate: (partial: Partial<AnnouncementListParams>) => void;
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
        className="z-1200 w-48 gap-0 overflow-hidden rounded-sm border border-border bg-surface p-0 shadow-card"
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
              "flex w-full cursor-pointer items-center px-3 py-2.5 text-xs font-medium transition",
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

function FiltersPopover({
  params,
  navigate,
  count,
}: {
  params: AnnouncementListParams;
  navigate: (partial: Partial<AnnouncementListParams>) => void;
  count: number;
}) {
  const [open, setOpen] = useState(false);

  function clearAll() {
    navigate({ type: undefined, categories: [], date: undefined, dateValue: undefined });
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
          <FilterSection title="Type">
            <FilterRow
              checked={!params.type}
              onCheckboxToggle={() => navigate({ type: undefined })}
              onRowSelect={() => {
                navigate({ type: undefined });
                setOpen(false);
              }}
              label="Tous"
            />
            {ANNOUNCEMENT_TYPES.map((t) => {
              const isActive = params.type === t.slug;
              return (
                <FilterRow
                  key={t.slug}
                  checked={isActive}
                  onCheckboxToggle={() =>
                    navigate({ type: isActive ? undefined : t.slug })
                  }
                  onRowSelect={() => {
                    navigate({ type: t.slug });
                    setOpen(false);
                  }}
                  label={t.label}
                />
              );
            })}
          </FilterSection>

          <FilterSection title="Date">
            <DateFilterRow
              checked={!params.date}
              onCheckboxToggle={() =>
                navigate({ date: undefined, dateValue: undefined })
              }
              onRowSelect={() => {
                navigate({ date: undefined, dateValue: undefined });
                setOpen(false);
              }}
              label="Toutes les dates"
            />
            <DateFilterRow
              checked={params.date === "today"}
              onCheckboxToggle={() =>
                navigate({
                  date: params.date === "today" ? undefined : "today",
                  dateValue: undefined,
                })
              }
              onRowSelect={() => {
                navigate({ date: "today", dateValue: undefined });
                setOpen(false);
              }}
              label="Aujourd'hui"
            />
            <DateFilterRow
              checked={params.date === "next7days"}
              onCheckboxToggle={() =>
                navigate({
                  date: params.date === "next7days" ? undefined : "next7days",
                  dateValue: undefined,
                })
              }
              onRowSelect={() => {
                navigate({ date: "next7days", dateValue: undefined });
                setOpen(false);
              }}
              label="7 prochains jours"
            />
            <DateFilterRow
              checked={params.date === "none"}
              onCheckboxToggle={() =>
                navigate({
                  date: params.date === "none" ? undefined : "none",
                  dateValue: undefined,
                })
              }
              onRowSelect={() => {
                navigate({ date: "none", dateValue: undefined });
                setOpen(false);
              }}
              label="Sans date"
            />
            <CustomDateRow
              params={params}
              onApply={(value) => {
                navigate({ date: "custom", dateValue: value });
                setOpen(false);
              }}
              onToggle={(value) => {
                if (params.date === "custom") {
                  navigate({ date: undefined, dateValue: undefined });
                } else {
                  navigate({
                    date: "custom",
                    dateValue: value ?? params.dateValue,
                  });
                }
              }}
            />
          </FilterSection>

          <FilterSection title="Catégorie">
            <FilterRow
              checked={params.categories.length === 0}
              onCheckboxToggle={() => navigate({ categories: [] })}
              onRowSelect={() => {
                navigate({ categories: [] });
                setOpen(false);
              }}
              label="Toutes les catégories"
            />
            {ANNOUNCEMENT_CATEGORIES.map((c) => {
              const checked = params.categories.includes(c.slug);
              return (
                <FilterRow
                  key={c.slug}
                  checked={checked}
                  colorHex={c.colorHex}
                  icon={c.Icon}
                  onCheckboxToggle={() => {
                    const next = checked
                      ? params.categories.filter((s) => s !== c.slug)
                      : [...params.categories, c.slug];
                    navigate({ categories: next });
                  }}
                  onRowSelect={() => {
                    navigate({ categories: [c.slug] });
                    setOpen(false);
                  }}
                  label={c.label}
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
    <section className="border-b border-border last:border-0 py-2">
      <h3 className="px-4 pb-1 pt-2 text-[11px] font-bold uppercase tracking-widest text-muted">
        {title}
      </h3>
      <div className="flex flex-col">{children}</div>
    </section>
  );
}

/**
 * Filter row with two click zones:
 * - the checkbox toggles the option and keeps the popover open (multi-select / refine);
 * - the rest of the row replaces the selection and closes the popover.
 */
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

function DateFilterRow(props: {
  checked: boolean;
  onCheckboxToggle: () => void;
  onRowSelect: () => void;
  label: string;
}) {
  return <FilterRow {...props} />;
}

function CustomDateRow({
  params,
  onApply,
  onToggle,
}: {
  params: AnnouncementListParams;
  onApply: (value: string) => void;
  onToggle: (value?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const checked = params.date === "custom";
  const selected = useMemo(() => {
    if (!params.dateValue) return undefined;
    const d = parseISO(params.dateValue);
    return isValid(d) ? d : undefined;
  }, [params.dateValue]);

  const labelText = selected
    ? format(selected, "d MMM yyyy", { locale: fr })
    : "Date précise";

  return (
    <div className="flex w-full items-center gap-3 px-4 py-2.5 transition hover:bg-warm/60 md:py-2">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label="Date précise"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
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
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              className="flex flex-1 cursor-pointer items-center gap-2 text-left text-sm font-medium text-text"
            >
              <CalendarIcon className="size-4 text-muted" aria-hidden />
              <span className="flex-1 truncate">{labelText}</span>
            </button>
          }
        />
        <PopoverContent className="w-auto gap-0 p-0" align="start" sideOffset={8}>
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(date) => {
              if (!date) return;
              const value = format(date, "yyyy-MM-dd");
              setOpen(false);
              onApply(value);
            }}
            captionLayout="dropdown"
            startMonth={new Date(new Date().getFullYear() - 1, 0)}
            endMonth={new Date(new Date().getFullYear() + 5, 11)}
            defaultMonth={selected ?? new Date()}
          />
        </PopoverContent>
      </Popover>
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

export function AnnouncementPagination({
  params,
  totalCount,
  pageSize,
}: {
  params: AnnouncementListParams;
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
          href={`${pathname}${buildAnnouncementListQuery({ ...params, page })}`}
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

// Suppress unused warning for AnnouncementDateFilter usage in JSDoc.
export type { AnnouncementDateFilter };
