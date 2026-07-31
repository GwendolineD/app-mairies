"use client";

import Link from "next/link";
import { Check, ChevronDown, Send, User, X, type LucideIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { RESIDENT_NAV_ICONS } from "@/components/features/resident-nav";
import { Button } from "@/components/ui/button";
import {
  FilterRow,
  FilterSection,
} from "@/components/ui/filter-sheet";
import { Input } from "@/components/ui/input";
import {
  FilterDesktopInline,
  FilterMobileSheetPanel,
  FilterMobileTriggerButton,
  useFilterSheetState,
} from "@/components/ui/responsive-filter-bar";
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
import { buildBackofficeAuditListQuery } from "@/lib/utils/audit-search-params";
import {
  activeBackofficeCommunesFilterCount,
  activeBackofficeMembersFilterCount,
  buildBackofficeCommunesListQuery,
  buildBackofficeMembersListQuery,
  type BackofficeCommunesListParams,
  type BackofficeMembersListParams,
  type CommunePaymentFilter,
  type CommuneSubscriptionFilter,
} from "@/lib/utils/backoffice-search-params";
import { buildBackofficeContenusListQuery } from "@/lib/utils/backoffice-contenus-params";
import { buildBackofficeInvitationsListQuery } from "@/lib/utils/backoffice-invitations-params";
import { buildBackofficeUtilisateursListQuery } from "@/lib/utils/backoffice-utilisateurs-params";
import type { AccessStatus } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

type FilterOption = {
  value: string;
  label: string;
};

type QueryVariant = "communes" | "members" | "audit" | "invitations" | "contenus" | "utilisateurs";

type BackofficeListParams = Record<
  string,
  string | number | boolean | string[] | undefined
>;

const BUILD_QUERY_BY_VARIANT: Record<
  QueryVariant,
  (params: BackofficeListParams) => string
> = {
  communes: buildBackofficeCommunesListQuery,
  members: buildBackofficeMembersListQuery,
  audit: buildBackofficeAuditListQuery,
  invitations: buildBackofficeInvitationsListQuery,
  contenus: buildBackofficeContenusListQuery,
  utilisateurs: buildBackofficeUtilisateursListQuery,
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
    <div className="flex items-center gap-2 rounded-sm px-1.5 py-2.5 text-sm font-medium hover:bg-warm md:py-1 min-h-11 md:min-h-0">
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
  const { navigate } = useBackofficeListNavigation({
    params,
    queryVariant,
    totalCount,
    pageSize,
  });
  const { open, setOpen } = useFilterSheetState();
  const [search, setSearch] = useState(String(params.q ?? ""));
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  const urlStatuses = Array.isArray(params.statuses)
    ? params.statuses.map(String)
    : params.status
      ? [String(params.status)]
      : [];

  const [localStatuses, setLocalStatuses] = useState<string[]>(urlStatuses);

  const communeParams =
    queryVariant === "communes"
      ? (params as unknown as BackofficeCommunesListParams)
      : null;

  const memberParams =
    queryVariant === "members"
      ? (params as unknown as BackofficeMembersListParams)
      : null;

  const memberStatuses = memberParams?.statuses ?? [];
  const memberBanned = memberParams?.banned ?? false;
  const memberNotifications = memberParams?.notifications;
  const memberRole = memberParams?.role;

  const filterCount =
    queryVariant === "communes" && communeParams
      ? activeBackofficeCommunesFilterCount(communeParams)
      : queryVariant === "members" && memberParams
        ? activeBackofficeMembersFilterCount(memberParams)
        : urlStatuses.length > 0 ||
            params.role ||
            (params.status && !statusMultiSelect)
          ? 1
          : 0;

  useEffect(() => {
    setLocalStatuses(urlStatuses);
  }, [urlStatuses.join(",")]);

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

  function navigateStatuses(nextStatuses: AccessStatus[]) {
    setLocalStatuses(nextStatuses);
    navigate({ statuses: nextStatuses });
  }

  function toggleStatus(status: string) {
    const next = localStatuses.includes(status)
      ? localStatuses.filter((value) => value !== status)
      : [...localStatuses, status];
    navigateStatuses(next as AccessStatus[]);
  }

  function clearCommuneFilters() {
    navigate({
      statuses: [],
      subscription: undefined,
      payment: undefined,
    });
    setLocalStatuses([]);
  }

  function navigateMemberStatuses(nextStatuses: string[]) {
    setLocalStatuses(nextStatuses);
    navigate({
      statuses: nextStatuses,
      status: undefined,
    });
  }

  function toggleMemberStatus(status: string) {
    const next = localStatuses.includes(status)
      ? localStatuses.filter((value) => value !== status)
      : [...localStatuses, status];
    navigateMemberStatuses(next);
  }

  function clearMemberStatusFilters() {
    navigate({
      statuses: [],
      status: undefined,
      banned: undefined,
    });
    setLocalStatuses([]);
  }

  function clearMemberFilters() {
    navigate({
      statuses: [],
      status: undefined,
      banned: undefined,
      role: undefined,
      notifications: undefined,
    });
    setLocalStatuses([]);
  }

  const subscription = communeParams?.subscription;
  const payment = communeParams?.payment;

  const desktopStatusFilter =
    statusOptions && statusMultiSelect ? (
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
              onToggle={() => toggleStatus(option.value)}
              onSelectOnly={() => {
                navigateStatuses([option.value as AccessStatus]);
                setStatusMenuOpen(false);
              }}
            />
          ))}
        </PopoverContent>
      </Popover>
    ) : null;

  const desktopSubscriptionFilters =
    queryVariant === "communes" ? (
      <>
        <Select
          items={[
            { value: "all", label: "Tous les abonnements" },
            { value: "with", label: "Avec abonnement actif" },
            { value: "without", label: "Sans abonnement actif" },
          ]}
          value={subscription ?? "all"}
          onValueChange={(value) => {
            if (!value || value === "all") {
              navigate({ subscription: undefined, payment: undefined });
              return;
            }
            navigate({
              subscription: value as CommuneSubscriptionFilter,
              payment:
                value === "with" ? payment : undefined,
            });
          }}
        >
          <SelectTrigger className="min-w-44 rounded-sm">
            <SelectValue placeholder="Abonnement" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les abonnements</SelectItem>
            <SelectItem value="with">Avec abonnement actif</SelectItem>
            <SelectItem value="without">Sans abonnement actif</SelectItem>
          </SelectContent>
        </Select>

        {subscription === "with" ? (
          <Select
            items={[
              { value: "all", label: "Tous les paiements" },
              { value: "paid", label: "Payé" },
              { value: "unpaid", label: "Impayé" },
            ]}
            value={payment ?? "all"}
            onValueChange={(value) => {
              if (!value || value === "all") {
                navigate({ payment: undefined });
                return;
              }
              navigate({ payment: value as CommunePaymentFilter });
            }}
          >
            <SelectTrigger className="min-w-36 rounded-sm">
              <SelectValue placeholder="Paiement" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les paiements</SelectItem>
              <SelectItem value="paid">Payé</SelectItem>
              <SelectItem value="unpaid">Impayé</SelectItem>
            </SelectContent>
          </Select>
        ) : null}
      </>
    ) : null;

  const mobileFilterSections =
    queryVariant === "communes" && statusOptions ? (
      <>
        <FilterSection title="Statut">
          <FilterRow
            checked={localStatuses.length === 0}
            onCheckboxToggle={() => {
              if (localStatuses.length === 0) return;
              navigateStatuses([]);
            }}
            onRowSelect={() => {
              navigateStatuses([]);
              setOpen(false);
            }}
            label="Tous les statuts"
          />
          {statusOptions.map((option) => {
            const checked = localStatuses.includes(option.value);
            return (
              <FilterRow
                key={option.value}
                checked={checked}
                onCheckboxToggle={() => toggleStatus(option.value)}
                onRowSelect={() => {
                  navigateStatuses([option.value as AccessStatus]);
                  setOpen(false);
                }}
                label={option.label}
              />
            );
          })}
        </FilterSection>

        <FilterSection title="Abonnement">
          <FilterRow
            checked={!subscription && !payment}
            onCheckboxToggle={() =>
              navigate({ subscription: undefined, payment: undefined })
            }
            onRowSelect={() => {
              navigate({ subscription: undefined, payment: undefined });
              setOpen(false);
            }}
            label="Tous les abonnements"
          />
          <FilterRow
            checked={subscription === "with" && payment === "paid"}
            onCheckboxToggle={() =>
              navigate({
                subscription: "with",
                payment:
                  subscription === "with" && payment === "paid"
                    ? undefined
                    : "paid",
              })
            }
            onRowSelect={() => {
              navigate({ subscription: "with", payment: "paid" });
              setOpen(false);
            }}
            label="Abonnement actif — payé"
          />
          <FilterRow
            checked={subscription === "with" && payment === "unpaid"}
            onCheckboxToggle={() =>
              navigate({
                subscription: "with",
                payment:
                  subscription === "with" && payment === "unpaid"
                    ? undefined
                    : "unpaid",
              })
            }
            onRowSelect={() => {
              navigate({ subscription: "with", payment: "unpaid" });
              setOpen(false);
            }}
            label="Abonnement actif — impayé"
          />
          <FilterRow
            checked={subscription === "with" && !payment}
            onCheckboxToggle={() =>
              navigate({
                subscription:
                  subscription === "with" && !payment ? undefined : "with",
                payment: undefined,
              })
            }
            onRowSelect={() => {
              navigate({ subscription: "with", payment: undefined });
              setOpen(false);
            }}
            label="Abonnement actif (tous)"
          />
          <FilterRow
            checked={subscription === "without"}
            onCheckboxToggle={() =>
              navigate({
                subscription: subscription === "without" ? undefined : "without",
                payment: undefined,
              })
            }
            onRowSelect={() => {
              navigate({ subscription: "without", payment: undefined });
              setOpen(false);
            }}
            label="Sans abonnement actif"
          />
        </FilterSection>
      </>
    ) : null;

  const memberFilterSections =
    queryVariant === "members" ? (
      <>
        <FilterSection title="Statut">
          <FilterRow
            checked={
              memberStatuses.length === 0 && !memberBanned
            }
            onCheckboxToggle={() => {
              if (memberStatuses.length === 0 && !memberBanned) return;
              clearMemberStatusFilters();
            }}
            onRowSelect={() => {
              clearMemberStatusFilters();
              setOpen(false);
            }}
            label="Tous les statuts"
          />
          <FilterRow
            checked={memberStatuses.includes("active")}
            onCheckboxToggle={() => toggleMemberStatus("active")}
            onRowSelect={() => {
              navigateMemberStatuses(["active"]);
              setOpen(false);
            }}
            label="Active"
          />
          <FilterRow
            checked={memberStatuses.includes("suspended")}
            onCheckboxToggle={() => toggleMemberStatus("suspended")}
            onRowSelect={() => {
              navigateMemberStatuses(["suspended"]);
              setOpen(false);
            }}
            label="Suspendu"
          />
          <FilterRow
            checked={memberBanned}
            onCheckboxToggle={() =>
              navigate({ banned: memberBanned ? undefined : true })
            }
            onRowSelect={() => {
              navigate({ banned: true });
              setOpen(false);
            }}
            label="Banni"
          />
        </FilterSection>

        {roleOptions ? (
          <FilterSection title="Rôle">
            <FilterRow
              checked={!memberRole}
              onCheckboxToggle={() => navigate({ role: undefined })}
              onRowSelect={() => {
                navigate({ role: undefined });
                setOpen(false);
              }}
              label="Tous les rôles"
            />
            {roleOptions.map((option) => (
              <FilterRow
                key={option.value}
                checked={memberRole === option.value}
                onCheckboxToggle={() =>
                  navigate({
                    role:
                      memberRole === option.value
                        ? undefined
                        : option.value,
                  })
                }
                onRowSelect={() => {
                  navigate({ role: option.value });
                  setOpen(false);
                }}
                label={option.label}
              />
            ))}
          </FilterSection>
        ) : null}

        <FilterSection title="Notifications">
          <FilterRow
            checked={!memberNotifications}
            onCheckboxToggle={() => navigate({ notifications: undefined })}
            onRowSelect={() => {
              navigate({ notifications: undefined });
              setOpen(false);
            }}
            label="Toutes"
          />
          <FilterRow
            checked={memberNotifications === "active"}
            onCheckboxToggle={() =>
              navigate({
                notifications:
                  memberNotifications === "active" ? undefined : "active",
              })
            }
            onRowSelect={() => {
              navigate({ notifications: "active" });
              setOpen(false);
            }}
            label="Actives"
          />
          <FilterRow
            checked={memberNotifications === "inactive"}
            onCheckboxToggle={() =>
              navigate({
                notifications:
                  memberNotifications === "inactive" ? undefined : "inactive",
              })
            }
            onRowSelect={() => {
              navigate({ notifications: "inactive" });
              setOpen(false);
            }}
            label="Inactives"
          />
        </FilterSection>
      </>
    ) : null;

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-center gap-2">
        <div className="relative min-w-0 flex-1 max-w-md">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={searchPlaceholder}
            className="rounded-sm pr-9 placeholder:text-xs md:placeholder:text-sm"
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

        {(queryVariant === "communes" || queryVariant === "members") ? (
          <>
            <FilterMobileTriggerButton
              filterCount={filterCount}
              onClick={() => setOpen(true)}
              className={cn(
                "shrink-0",
                queryVariant === "communes" && "md:hidden",
              )}
            />
            <FilterMobileSheetPanel
              open={open}
              onClose={() => setOpen(false)}
              filterCount={filterCount}
              totalResults={totalCount}
              onClearAll={
                queryVariant === "communes"
                  ? clearCommuneFilters
                  : clearMemberFilters
              }
            >
              {queryVariant === "communes"
                ? mobileFilterSections
                : memberFilterSections}
            </FilterMobileSheetPanel>
          </>
        ) : null}
      </div>

      <FilterDesktopInline>
        {desktopStatusFilter}
        {desktopSubscriptionFilters}

        {statusOptions && !statusMultiSelect && queryVariant !== "members" ? (
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

        {roleOptions && queryVariant !== "members" ? (
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
      </FilterDesktopInline>
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
  icon?: LucideIcon;
  /** When set, the value is rendered as a link (e.g. commune or author). */
  href?: string;
  /** When true, renders `value` only — no "Label · value" prefix. */
  standalone?: boolean;
};

const LIST_FIELD_ICONS: Record<string, LucideIcon> = {
  "Adhérent·es": User,
  Annonces: RESIDENT_NAV_ICONS.Annonces,
  Initiatives: RESIDENT_NAV_ICONS.Initiatives,
  "Événements": RESIDENT_NAV_ICONS["Événements"],
  Invitations: Send,
};

function stopLinkNavigation(event: React.SyntheticEvent) {
  event.stopPropagation();
}

function ListFieldIconStat({ label, value, icon }: ListField & { icon: LucideIcon }) {
  const Icon = icon;

  return (
    <Popover>
      <PopoverTrigger
        nativeButton={false}
        render={
          <span
            role="button"
            tabIndex={0}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm px-1 py-0.5 text-sm font-medium transition hover:bg-warm"
            aria-label={`${label} : ${value}`}
            onClick={stopLinkNavigation}
            onPointerDown={stopLinkNavigation}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                stopLinkNavigation(event);
              }
            }}
          />
        }
      >
        <Icon className="size-5 shrink-0 text-subtle" aria-hidden />
        <span className="tabular-nums text-text">{value}</span>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        sideOffset={6}
        className="w-auto p-3"
      >
        <span className="whitespace-nowrap text-sm font-semibold text-text">
          {label}
        </span>
      </PopoverContent>
    </Popover>
  );
}

export function BackofficeListLinkCard({
  href,
  title,
  titleAside,
  fields,
  fieldsDisplay = "text",
  mobileFieldSplitAfter,
  statsRowLeading,
  metaLeading,
  metaTrailing,
  footer,
  className,
}: {
  href: string;
  title: React.ReactNode;
  titleAside?: React.ReactNode;
  fields: ListField[];
  fieldsDisplay?: "text" | "icon";
  /** Mobile only: first N fields on their own row(s), remainder on the next row. */
  mobileFieldSplitAfter?: number;
  /** Rendered before primary stats (e.g. subscription icon on the adherents row). */
  statsRowLeading?: React.ReactNode;
  /** Second meta row, left-aligned (e.g. author). Shown with metaTrailing on its own line. */
  metaLeading?: React.ReactNode;
  metaTrailing?: React.ReactNode;
  /** Rendered below fields, outside the title link (e.g. member actions). */
  footer?: React.ReactNode;
  className?: string;
}) {
  function renderField(field: ListField) {
    if (fieldsDisplay === "icon") {
      const Icon = field.icon ?? LIST_FIELD_ICONS[field.label];
      if (Icon) {
        return (
          <ListFieldIconStat
            key={field.label}
            label={field.label}
            value={field.value}
            icon={Icon}
          />
        );
      }
    }

    if (field.standalone) {
      return (
        <div key={field.label} className="shrink-0">
          {field.value}
        </div>
      );
    }

    const valueNode = field.href ? (
      <Link
        href={field.href}
        className="text-text transition hover:text-purple"
      >
        {field.value}
      </Link>
    ) : (
      <span className="text-text">{field.value}</span>
    );

    return (
      <p key={field.label} className="min-w-0 truncate">
        <span className="text-subtle">{field.label}</span>
        {" · "}
        {valueNode}
      </p>
    );
  }

  const hasMobileSplit =
    mobileFieldSplitAfter != null &&
    mobileFieldSplitAfter > 0 &&
    mobileFieldSplitAfter < fields.length;
  const primaryFields = hasMobileSplit
    ? fields.slice(0, mobileFieldSplitAfter)
    : fields;
  const secondaryFields = hasMobileSplit
    ? fields.slice(mobileFieldSplitAfter)
    : [];

  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-surface px-4 py-4",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href={href}
          className="min-w-0 truncate text-base font-semibold text-text transition hover:text-purple"
        >
          {title}
        </Link>
        {titleAside ? <div key="title-aside">{titleAside}</div> : null}
      </div>

      <div className="mt-3 flex flex-col gap-y-2">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          {hasMobileSplit ? (
            <div className="flex w-full flex-col gap-y-2 text-sm font-medium text-muted md:flex md:w-auto md:flex-row md:flex-wrap md:items-center md:gap-x-3 md:gap-y-2">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 md:contents">
                {statsRowLeading ? (
                  <div key="stats-leading">{statsRowLeading}</div>
                ) : null}
                {primaryFields.map(renderField)}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 md:contents">
                {secondaryFields.map(renderField)}
              </div>
            </div>
          ) : (
            <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-muted md:w-auto">
              {statsRowLeading ? (
                <div key="stats-leading">{statsRowLeading}</div>
              ) : null}
              {fields.map(renderField)}
            </div>
          )}

          {metaTrailing && !metaLeading ? (
            <p className="ml-auto shrink-0 text-right text-xs font-medium text-muted">
              {metaTrailing}
            </p>
          ) : null}
        </div>

        {metaLeading ? (
          <div className="flex items-center justify-between gap-x-4 gap-y-2">
            <div className="min-w-0 truncate text-xs font-medium text-muted">
              {metaLeading}
            </div>
            {metaTrailing ? (
              <p className="shrink-0 text-right text-xs font-medium text-muted">
                {metaTrailing}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {footer ? <div className="mt-3 flex justify-end">{footer}</div> : null}
    </div>
  );
}
