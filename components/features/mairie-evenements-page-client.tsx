"use client";

import { Plus } from "lucide-react";
import { EventCard, type EventCardData } from "@/components/features/event-card";
import { useCreationModals } from "@/components/features/creation-modal-context";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/ui/page-heading";
import { ROUTES } from "@/lib/constants/routes";

type Props = {
  items: EventCardData[];
  total: number;
  currentPage: number;
  totalPages: number;
};

function buildPageHref(page: number): string {
  return page > 1
    ? `${ROUTES.mairie.evenements}?page=${page}`
    : ROUTES.mairie.evenements;
}

export function MairieEvenementsPageClient({
  items,
  total,
  currentPage,
  totalPages,
}: Props) {
  const { openEventModal } = useCreationModals();

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2 md:space-y-4">
        <div className="mb-3 hidden md:block">
          <PageHeading
            title="Evénements Mairie"
            subtitle="Liste des événements créés par la Mairie"
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
            {total} événement{total > 1 ? "s" : ""} · page {currentPage} /{" "}
            {totalPages}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 md:hidden">
          <PageHeading title="Evénements Mairie" />
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
          Aucun événement officiel pour l&apos;instant.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {items.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              hrefBuilder={ROUTES.mairie.evenementDetail}
            />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <Button
            href={buildPageHref(Math.max(1, currentPage - 1))}
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
            href={buildPageHref(Math.min(totalPages, currentPage + 1))}
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
