import Link from "next/link";
import type { ReactNode } from "react";
import { Clock, MapPin, type LucideIcon } from "lucide-react";
import { ROUTES } from "@/lib/constants/routes";
import type { AnnouncementWithAuthor } from "@/lib/queries/announcements";
import type { InitiativeWithAuthor } from "@/lib/queries/initiatives";
import type { AgendaEventRecord } from "@/lib/types";
import {
  formatEventAccueilDate,
  formatEventAccueilSchedule,
} from "@/lib/utils/date";
import { cn } from "@/lib/utils";
import { AccueilSectionLink } from "@/components/features/accueil-sections";
import { AnnouncementCard } from "@/components/features/announcement-card";
import { InitiativeCard } from "@/components/features/initiative-card";

const feedCardClass =
  "md:overflow-hidden md:rounded-xl md:border md:border-border/60 md:bg-surface";

function AccueilSectionHeader({
  icon: Icon,
  emoji,
  title,
  mobileTitle,
  href,
}: {
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  mobileTitle?: string;
  href: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 md:mb-0">
      <h3 className="flex items-center gap-1.5 text-sm font-bold leading-5 text-text md:text-base md:leading-snug">
        {Icon ? (
          <Icon className="size-5 shrink-0 text-coral/85" aria-hidden />
        ) : emoji ? (
          <span aria-hidden>{emoji}</span>
        ) : null}
        {mobileTitle ? (
          <>
            <span className="md:hidden">{mobileTitle}</span>
            <span className="hidden md:inline">{title}</span>
          </>
        ) : (
          title
        )}
      </h3>
      <AccueilSectionLink href={href} label="Explorer" size="sm" />
    </div>
  );
}

function AccueilFeedCard({
  icon,
  emoji,
  title,
  mobileTitle,
  href,
  children,
  className,
}: {
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  mobileTitle?: string;
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(feedCardClass, className)}>
      <div className="md:px-5 md:pt-4 md:pb-3">
        <AccueilSectionHeader
          icon={icon}
          emoji={emoji}
          title={title}
          mobileTitle={mobileTitle}
          href={href}
        />
      </div>
      {children}
    </div>
  );
}

const EVENT_DATE_THEMES = [
  { box: "bg-coral/10 text-coral" },
  { box: "bg-turquoise/10 text-turquoise" },
  { box: "bg-purple/10 text-purple" },
] as const;

type NeighborInitiativesProps = {
  initiatives: InitiativeWithAuthor[];
};

export function AccueilTrendingInitiative({
  initiatives,
}: NeighborInitiativesProps) {
  return (
    <AccueilFeedCard
      emoji="✨"
      title="Vos voisins ont des idées"
      href={ROUTES.initiatives.list}
    >
      {initiatives.length === 0 ? (
        <p className="text-sm font-medium text-muted md:p-6">
          Aucune initiative pour le moment.
        </p>
      ) : (
        <ul className="space-y-3 md:px-5 md:pb-5">
          {initiatives.map((initiative) => (
            <li key={initiative.id}>
              <InitiativeCard initiative={initiative} layout="horizontal" />
            </li>
          ))}
        </ul>
      )}
    </AccueilFeedCard>
  );
}

type RecentAnnouncementsProps = {
  items: AnnouncementWithAuthor[];
};

export function AccueilRecentAnnouncements({ items }: RecentAnnouncementsProps) {
  return (
    <AccueilFeedCard
      emoji="📢"
      title="Vos voisins ont posté"
      mobileTitle="Annonces récentes"
      href={ROUTES.annonces.list}
    >
      {items.length === 0 ? (
        <p className="text-sm font-medium text-muted md:p-6">
          Aucune annonce récente.
        </p>
      ) : (
        <ul className="space-y-3 md:px-5 md:pb-5">
          {items.map((announcement) => (
            <li key={announcement.id}>
              <AnnouncementCard
                announcement={announcement}
                layout="horizontal"
              />
            </li>
          ))}
        </ul>
      )}
    </AccueilFeedCard>
  );
}

type UpcomingEventsProps = {
  events: AgendaEventRecord[];
  volunteerCountByInitiativeId?: Record<string, number>;
};

function EventVolunteerGauge({
  registered,
  needed,
}: {
  registered: number;
  needed: number;
}) {
  const progress = Math.min(
    100,
    Math.round((registered / needed) * 100),
  );

  return (
    <div className="mt-2 flex items-center gap-3">
      <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-orange transition-all"
          style={{
            width: `${Math.max(progress, registered > 0 ? 8 : 0)}%`,
          }}
        />
      </div>
      <span className="shrink-0 text-xs font-bold text-muted">
        {registered}/{needed} bénévole{needed !== 1 ? "s" : ""}
      </span>
    </div>
  );
}

export function AccueilUpcomingEvents({
  events,
  volunteerCountByInitiativeId = {},
}: UpcomingEventsProps) {
  return (
    <AccueilFeedCard
      emoji="📅"
      title="Événements à venir"
      href={ROUTES.evenements.list}
      className="lg:h-full"
    >
      {events.length === 0 ? (
        <p className="text-sm font-medium text-muted md:p-6">
          Aucun événement à venir.
        </p>
      ) : (
        <ul className="divide-y divide-border/60">
          {events.map((event, index) => {
            const theme = EVENT_DATE_THEMES[index % EVENT_DATE_THEMES.length];
            const { day, month } = formatEventAccueilDate(event.starts_at);
            const location = event.address_label?.trim() ?? "Adresse non renseignée";
            const volunteersNeeded = event.volunteers_needed ?? 0;
            const volunteerCount = event.source_initiative_id
              ? (volunteerCountByInitiativeId[event.source_initiative_id] ?? 0)
              : 0;

            return (
              <li key={event.id}>
                <Link
                  href={ROUTES.evenements.detail(event.id)}
                  className="flex items-center gap-3 transition hover:scale-[1.02] hover:bg-warm/40 md:gap-4 md:p-5"
                >
                  <div
                    className={cn(
                      "flex size-14 shrink-0 flex-col items-center justify-center rounded-lg md:size-16",
                      theme.box,
                    )}
                  >
                    <span className="text-xl font-bold leading-none md:text-2xl">
                      {day}
                    </span>
                    <span className="mt-0.5 text-[10px] font-bold tracking-wide">
                      {month}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm font-bold leading-snug text-text md:text-base">
                      {event.title}
                    </p>
                    <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
                      <Clock className="size-3.5 shrink-0" aria-hidden />
                      {formatEventAccueilSchedule(event.starts_at, event.ends_at)}
                    </p>
                    <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
                      <MapPin className="size-3.5 shrink-0" aria-hidden />
                      {location}
                    </p>
                    {volunteersNeeded > 0 ? (
                      <EventVolunteerGauge
                        registered={volunteerCount}
                        needed={volunteersNeeded}
                      />
                    ) : null}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AccueilFeedCard>
  );
}
