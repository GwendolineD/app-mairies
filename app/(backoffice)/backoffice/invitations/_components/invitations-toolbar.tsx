"use client";

import { X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { DatePickerField } from "@/components/ui/date-picker-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { resolveEndDateAfterStartChange } from "@/lib/datetime";
import type { PilotCommuneOption } from "@/lib/queries/backoffice-communes";
import {
  INVITATION_DERIVED_STATUS,
  INVITATION_DERIVED_STATUS_LABELS,
  buildBackofficeInvitationsListQuery,
  type BackofficeInvitationsListParams,
} from "@/lib/utils/backoffice-invitations-params";

type InvitationsToolbarProps = {
  params: BackofficeInvitationsListParams;
  communes: PilotCommuneOption[];
};

export function InvitationsToolbar({
  params,
  communes,
}: InvitationsToolbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(params.q);

  function navigate(next: Partial<BackofficeInvitationsListParams>) {
    startTransition(() => {
      router.push(
        `${pathname}${buildBackofficeInvitationsListQuery({ ...params, page: 1, ...next })}`,
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

  return (
    <div className="flex flex-col gap-3">
      <div className="relative max-w-md w-full">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher par email"
          className="rounded-sm pr-9"
          aria-label="Rechercher par email"
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

        <Select
          items={[
            { value: "all", label: "Tous les statuts" },
            ...Object.values(INVITATION_DERIVED_STATUS).map((status) => ({
              value: status,
              label: INVITATION_DERIVED_STATUS_LABELS[status],
            })),
          ]}
          value={params.status ?? "all"}
          onValueChange={(value) => {
            if (!value || value === "all") {
              navigate({ status: undefined });
              return;
            }
            navigate({
              status: value as BackofficeInvitationsListParams["status"],
            });
          }}
        >
          <SelectTrigger className="min-w-36 rounded-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {Object.values(INVITATION_DERIVED_STATUS).map((status) => (
              <SelectItem key={status} value={status}>
                {INVITATION_DERIVED_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          items={[
            { value: "all", label: "Relance : toutes" },
            { value: "true", label: "Relance envoyée" },
            { value: "false", label: "Sans relance" },
          ]}
          value={
            params.reminded === true
              ? "true"
              : params.reminded === false
                ? "false"
                : "all"
          }
          onValueChange={(value) => {
            if (!value || value === "all") {
              navigate({ reminded: undefined });
              return;
            }
            navigate({ reminded: value === "true" });
          }}
        >
          <SelectTrigger className="min-w-40 rounded-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Relance : toutes</SelectItem>
            <SelectItem value="true">Relance envoyée</SelectItem>
            <SelectItem value="false">Sans relance</SelectItem>
          </SelectContent>
        </Select>

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

        {isPending ? (
          <span className="text-xs font-medium text-muted">Mise à jour…</span>
        ) : null}
      </div>
    </div>
  );
}
