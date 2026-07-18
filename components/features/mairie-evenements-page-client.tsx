"use client";

import { Plus } from "lucide-react";
import { EventCard, type EventCardData } from "@/components/features/event-card";
import { useCreationModals } from "@/components/features/creation-modal-context";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/ui/page-heading";
import { ROUTES } from "@/lib/constants/routes";

type StatusFilter = "actives" | "toutes";

type Props = {
  items: EventCardData[];
  total: number;
  currentPage: number;
  totalPages: number;
  statusFilter: StatusFilter;
};

const STATUS_FILTERS = [
  { key: "actives" as const, label: "Actifs" },
  { key: "toutes" as const, label: "Tous" },
];

function buildPageHref(page: number, statusFilter: StatusFilter): string {
  const sp = new URLSearchParams();
  if (page > 1) sp.set("page", String(page));
  if (statusFilter !== "actives") sp.set("statut", statusFilter);
  const qs = sp.toString();
  return qs ? `${ROUTES.mairie.evenements}?${qs}` : ROUTES.mairie.evenements;
}

export function MairieEvenementsPageClient({
  items,
  total,
  currentPage,
  totalPages,
  statusFilter,
}: Props) {
  const { openEventModal } = useCreationModals();

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2 md:space-y-4">
        <div className="mb-3 hidden md:block">
          <PageHeading
            title="Événements"
            subtitle="Événements officiels publiés par la mairie"
            actions={
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="font-bold"
                onClick={() => openEventModal()}
              >
                <span className="text-sm leading-none">+</span>
                Créer un événement
              </Button>
            }
          />
          <p className="mt-2 text-xs font-medium text-muted">
            {total} événement{total > 1 ? "s" : ""}
            {statusFilter === "actives"
              ? ` actif${total > 1 ? "s" : ""}`
              : ""}{" "}
            · page {currentPage} / {totalPages}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 px-0 md:px-0">
          {STATUS_FILTERS.map((f) => (
            <Button
              key={f.key}
              href={buildPageHref(1, f.key)}
              variant={statusFilter === f.key ? "primary" : "secondary"}
              className="px-4 py-2 text-xs"
            >
              {f.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 md:hidden">
          <PageHeading title="Événements" />
          <Button
            type="button"
            variant="primary"
            size="icon-sm"
            aria-label="Créer un événement"
            className="size-[34px] shrink-0 p-0"
            onClick={() => openEventModal()}
          >
            <Plus aria-hidden />
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm font-medium text-muted">
          {statusFilter === "actives"
            ? "Aucun événement officiel actif pour l'instant."
            : "Aucun événement officiel pour l'instant."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {items.map((event, index) => (
            <EventCard
              key={event.id}
              event={event}
              hrefBuilder={ROUTES.mairie.evenementDetail}
              priority={index === 0}
            />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <Button
            href={buildPageHref(Math.max(1, currentPage - 1), statusFilter)}
            variant="secondary"
            className={
              currentPage <= 1
                ? "pointer-events-none px-4 py-2 text-xs opacity-50"
                : "px-4 py-2 text-xs"
            }
          >
            ← Précédent
          </Button>
          <Button
            href={buildPageHref(Math.min(totalPages, currentPage + 1), statusFilter)}
            variant="secondary"
            className={
              currentPage >= totalPages
                ? "pointer-events-none px-4 py-2 text-xs opacity-50"
                : "px-4 py-2 text-xs"
            }
          >
            Suivant →
          </Button>
        </div>
      ) : null}
    </div>
  );
}
