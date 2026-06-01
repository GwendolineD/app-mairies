import Link from "next/link";
import type { ReactNode } from "react";
import { Clock, Heart, MapPin, MessageCircle } from "lucide-react";
import { formatStreetDisplay } from "@/lib/ban/display";
import { ROUTES } from "@/lib/constants/routes";
import {
  getCategoryColorHex,
  getCategoryLabel,
} from "@/lib/constants/announcement-categories";
import type { AnnouncementWithAuthor } from "@/lib/queries/announcements";
import type { AgendaEventRecord, InitiativeRecord } from "@/lib/types";
import { resolveFirstName } from "@/lib/utils/display-name";
import {
  formatEventAccueilDate,
  formatEventAccueilSchedule,
  formatRelativeTimeAccueil,
} from "@/lib/utils/date";
import { cn } from "@/lib/utils";
import { AccueilSectionLink } from "@/components/features/accueil-sections";

const feedCardClass =
  "overflow-hidden rounded-xl border border-border/60 bg-surface";

function AccueilSectionHeader({
  emoji,
  title,
  href,
}: {
  emoji: string;
  title: string;
  href: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-xs font-bold leading-snug text-text md:text-base">
        <span aria-hidden className="mr-1.5">
          {emoji}
        </span>
        {title}
      </h3>
      <AccueilSectionLink href={href} label="Tout voir" size="sm" />
    </div>
  );
}

function AccueilFeedCard({
  emoji,
  title,
  href,
  children,
  className,
}: {
  emoji: string;
  title: string;
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(feedCardClass, className)}>
      <div className="px-4 pt-4 pb-3 md:px-5">
        <AccueilSectionHeader emoji={emoji} title={title} href={href} />
      </div>
      {children}
    </div>
  );
}

function getAccueilCategoryBadge(type: string, categorySlug: string) {
  const hex = getCategoryColorHex(categorySlug);
  if (type === "demande" && categorySlug !== "don-troc" && categorySlug !== "pret-objet") {
    return { label: "COUP DE MAIN", colorHex: hex };
  }
  return {
    label: getCategoryLabel(categorySlug).toUpperCase(),
    colorHex: hex,
  };
}

function announcementAuthorName(announcement: AnnouncementWithAuthor): string {
  const profile = announcement.author_membership?.profiles;
  if (!profile) return "Un voisin";
  return resolveFirstName(profile);
}

const EVENT_DATE_THEMES = [
  { box: "bg-coral/10 text-coral", badge: "bg-coral/10 text-coral" },
  { box: "bg-turquoise/10 text-turquoise", badge: "bg-sun/15 text-orange" },
  { box: "bg-purple/10 text-purple", badge: "bg-purple/10 text-purple" },
] as const;

const EVENT_STATUS_LABELS = [
  { label: "Populaire", emoji: "🔥" },
  { label: "En vedette", emoji: "⭐" },
  { label: "À ne pas manquer", emoji: "" },
] as const;

type TrendingInitiativeProps = {
  initiative: InitiativeRecord | null;
  participantCount: number;
};

export function AccueilTrendingInitiative({
  initiative,
  participantCount,
}: TrendingInitiativeProps) {
  const progress = Math.min(100, Math.round((participantCount / 50) * 100));

  return (
    <AccueilFeedCard
      emoji="🔥"
      title="L'initiative qui monte"
      href={ROUTES.initiatives.list}
    >
      {initiative ? (
        <Link
          href={ROUTES.initiatives.detail(initiative.id)}
          className="block p-5 transition hover:bg-warm/40 md:p-6"
        >
          <p className="text-[11px] font-bold uppercase tracking-wide text-coral">
            Tendance
          </p>
          <div className="mt-3 flex gap-3">
            <span className="text-3xl leading-none" aria-hidden>
              🎲
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-base font-bold leading-snug text-text">
                {initiative.title}
              </p>
              {initiative.description ? (
                <p className="line-clamp-2 text-sm font-medium leading-5 text-muted">
                  {initiative.description}
                </p>
              ) : null}
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-coral transition-all"
                style={{ width: `${Math.max(progress, participantCount > 0 ? 8 : 0)}%` }}
              />
            </div>
            <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-coral">
              {participantCount}
              <Heart className="size-3.5 fill-coral text-coral" aria-hidden />
            </span>
          </div>
        </Link>
      ) : (
        <p className="p-5 text-sm font-medium text-muted md:p-6">
          Aucune initiative pour le moment.
        </p>
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
      href={ROUTES.annonces.list}
    >
      {items.length === 0 ? (
        <p className="p-5 text-sm font-medium text-muted md:p-6">
          Aucune annonce récente.
        </p>
      ) : (
        <ul className="divide-y divide-border/60">
          {items.map((announcement) => {
            const category = getAccueilCategoryBadge(
              announcement.type,
              announcement.category_slug,
            );
            const location = formatStreetDisplay(
              announcement.author_membership?.address_label,
            );

            return (
              <li key={announcement.id}>
                <Link
                  href={ROUTES.annonces.detail(announcement.id)}
                  className="flex items-center gap-3 p-4 transition hover:bg-warm/40 md:gap-4 md:p-5"
                >
                  {announcement.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={announcement.photo_url}
                      alt=""
                      className="size-14 shrink-0 rounded-lg object-cover md:size-16"
                    />
                  ) : (
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-warm text-[10px] font-bold uppercase tracking-wide text-muted md:size-16">
                      Annonce
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-[11px] font-bold uppercase tracking-wide"
                      style={{ color: category.colorHex }}
                    >
                      {category.label}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-sm font-bold leading-snug text-text">
                      {announcement.title}
                    </p>
                    <p className="mt-1 text-xs font-medium text-muted">
                      {announcementAuthorName(announcement)} ·{" "}
                      {formatRelativeTimeAccueil(announcement.created_at)} · {location}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-subtle">
                    <MessageCircle className="size-4" aria-hidden />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AccueilFeedCard>
  );
}

type UpcomingEventsProps = {
  events: AgendaEventRecord[];
};

export function AccueilUpcomingEvents({ events }: UpcomingEventsProps) {
  return (
    <AccueilFeedCard
      emoji="📅"
      title="Événements à venir"
      href={ROUTES.evenements.list}
      className="lg:h-full"
    >
      {events.length === 0 ? (
        <p className="p-5 text-sm font-medium text-muted md:p-6">
          Aucun événement à venir.
        </p>
      ) : (
        <ul className="divide-y divide-border/60">
          {events.map((event, index) => {
            const theme = EVENT_DATE_THEMES[index % EVENT_DATE_THEMES.length];
            const status = EVENT_STATUS_LABELS[index % EVENT_STATUS_LABELS.length];
            const { day, month } = formatEventAccueilDate(event.starts_at);
            const location = formatStreetDisplay(event.address_label);

            return (
              <li key={event.id}>
                <Link
                  href={ROUTES.evenements.detail(event.id)}
                  className="flex items-start gap-3 p-4 transition hover:bg-warm/40 md:gap-4 md:p-5"
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
                      {formatEventAccueilSchedule(event.starts_at)}
                    </p>
                    <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
                      <MapPin className="size-3.5 shrink-0" aria-hidden />
                      {location}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "hidden shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold sm:inline-flex",
                      theme.badge,
                    )}
                  >
                    {status.label}
                    {status.emoji ? ` ${status.emoji}` : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AccueilFeedCard>
  );
}
