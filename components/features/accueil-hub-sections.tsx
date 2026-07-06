import type { ReactNode } from "react";
import { ROUTES } from "@/lib/constants/routes";
import type { AnnouncementWithAuthor } from "@/lib/queries/announcements";
import type { InitiativeWithAuthor } from "@/lib/queries/initiatives";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AnnouncementCard } from "@/components/features/announcement-card";
import type { EventCardData } from "@/components/features/event-card";
import { EventCard } from "@/components/features/event-card";
import { InitiativeCard } from "@/components/features/initiative-card";

type AccueilHubSectionProps = {
  emoji: string;
  title: string;
  breakdown?: string;
  ctaLabel: string;
  ctaHref: string;
  preview?: ReactNode;
  emptyState?: ReactNode;
  showPreviewHint?: boolean;
  className?: string;
};

function AccueilHubSection({
  emoji,
  title,
  breakdown,
  ctaLabel,
  ctaHref,
  preview,
  emptyState,
  showPreviewHint = false,
  className,
}: AccueilHubSectionProps) {
  return (
    <Card
      className={cn(
        "flex flex-col gap-4 rounded-none border-0 bg-transparent p-0 shadow-none md:rounded-3xl md:border md:border-border/60 md:bg-surface md:p-5 md:shadow-card",
        className,
      )}
    >
      <div className="space-y-1">
        <h3 className="flex items-center gap-1.5 text-lg font-bold leading-7 text-text md:text-xl md:leading-7">
          <span aria-hidden>{emoji}</span>
          {title}
        </h3>
        {breakdown ? (
          <p className="text-sm font-medium text-muted">{breakdown}</p>
        ) : null}
      </div>

      {preview ? (
        <div className="space-y-2 px-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
            À la une
          </p>
          {preview}
          {showPreviewHint ? (
            <p className="text-xs font-medium text-subtle">
              Cet aperçu change au fil des publications.
            </p>
          ) : null}
        </div>
      ) : (
        emptyState
      )}

      <Button
        variant="secondary"
        size="default"
        href={ctaHref}
        className="w-full py-3 font-bold"
      >
        {ctaLabel}
      </Button>
    </Card>
  );
}

type AccueilAnnouncementsHubProps = {
  totalCount: number;
  demandeCount: number;
  offreCount: number;
  featured: AnnouncementWithAuthor | null;
};

export function AccueilAnnouncementsHub({
  totalCount,
  demandeCount,
  offreCount,
  featured,
}: AccueilAnnouncementsHubProps) {
  const title =
    totalCount === 0
      ? "Aucune annonce active"
      : totalCount === 1
        ? "1 annonce active"
        : `${totalCount} annonces actives`;

  const breakdown =
    totalCount > 0
      ? `${demandeCount} demande${demandeCount !== 1 ? "s" : ""} · ${offreCount} offre${offreCount !== 1 ? "s" : ""}`
      : undefined;

  const ctaLabel =
    totalCount > 0
      ? `Voir les ${totalCount} annonces`
      : "Voir toutes les annonces";

  return (
    <AccueilHubSection
      emoji="📢"
      title={title}
      breakdown={breakdown}
      ctaLabel={ctaLabel}
      ctaHref={ROUTES.annonces.list}
      showPreviewHint={totalCount > 1}
      preview={
        featured ? (
          <AnnouncementCard announcement={featured} layout="horizontal" />
        ) : undefined
      }
      emptyState={
        !featured ? (
          <p className="text-sm font-medium text-muted">
            Aucune annonce pour le moment. Soyez le premier à publier !
          </p>
        ) : undefined
      }
    />
  );
}

type AccueilInitiativesHubProps = {
  totalCount: number;
  featured: InitiativeWithAuthor | null;
};

export function AccueilInitiativesHub({
  totalCount,
  featured,
}: AccueilInitiativesHubProps) {
  const title =
    totalCount === 0
      ? "Aucune initiative"
      : totalCount === 1
        ? "1 initiative"
        : `${totalCount} initiatives`;

  const ctaLabel =
    totalCount > 0
      ? `Voir les ${totalCount} initiatives`
      : "Voir toutes les initiatives";

  return (
    <AccueilHubSection
      emoji="✨"
      title={title}
      ctaLabel={ctaLabel}
      ctaHref={ROUTES.initiatives.list}
      showPreviewHint={totalCount > 1}
      className="mt-6 lg:mt-0"
      preview={
        featured ? (
          <InitiativeCard initiative={featured} layout="horizontal" />
        ) : undefined
      }
      emptyState={
        !featured ? (
          <p className="text-sm font-medium text-muted">
            Soyez le premier à lancer une initiative !
          </p>
        ) : undefined
      }
    />
  );
}

type AccueilEventsHubProps = {
  totalCount: number;
  featured: EventCardData | null;
};

export function AccueilEventsHub({
  totalCount,
  featured,
}: AccueilEventsHubProps) {
  const title =
    totalCount === 0
      ? "Aucun événement à venir"
      : totalCount === 1
        ? "1 événement à venir"
        : `${totalCount} événements à venir`;

  const ctaLabel =
    totalCount > 0 ? `Voir l'agenda (${totalCount})` : "Voir l'agenda";

  return (
    <AccueilHubSection
      emoji="📅"
      title={title}
      ctaLabel={ctaLabel}
      ctaHref={ROUTES.evenements.list}
      showPreviewHint={totalCount > 1}
      className="mt-6 lg:mt-0 lg:h-full"
      preview={
        featured ? (
          <EventCard event={featured} layout="horizontal" />
        ) : undefined
      }
      emptyState={
        !featured ? (
          <p className="text-sm font-medium text-muted">
            Aucun événement à venir pour le moment.
          </p>
        ) : undefined
      }
    />
  );
}
