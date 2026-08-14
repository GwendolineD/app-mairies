import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { CloudImage } from "@/components/ui/cloud-image";
import { CONTENT_ICONS } from "@/lib/constants/content-icons";
import { ROUTES } from "@/lib/constants/routes";
import {
  getInitiativeCategoryColorHex,
  getInitiativeCategoryLabel,
  getInitiativeCategoryDefaultImageUrl,
} from "@/lib/constants/initiative-categories";
import { Card } from "@/components/ui/card";
import { CategoryTag } from "@/components/ui/category-tag";
import { ContentSuspendedBadge } from "@/components/features/content-suspended-indicator";
import { ContentActionRequiredBadge } from "@/components/features/content-action-required-badge";
import { cn } from "@/lib/utils/cn";
import type { NudgeableContent } from "@/lib/utils/content-nudge";
import {
  contentActionRequiredCardBorder,
  getContentNudgeReason,
} from "@/lib/utils/content-nudge";
import { getEventRangeParts } from "@/lib/datetime";
import type { AgendaEventRecord } from "@/lib/types";

export type EventCardData = Pick<
  AgendaEventRecord,
  | "id"
  | "title"
  | "description"
  | "photo_url"
  | "category_slug"
  | "address_label"
  | "starts_at"
  | "ends_at"
  | "volunteers_needed"
  | "suspended_at"
> & {
  volunteers_registered?: number;
  participants_count?: number;
};

type Props = {
  event: EventCardData;
  layout?: "vertical" | "horizontal";
  highlighted?: boolean;
  hrefBuilder?: (id: string) => string;
  nudgeContent?: NudgeableContent;
  /** Preload the card photo (first visible item in a list). */
  priority?: boolean;
};

function resolveImageUrl(event: EventCardData): string | null {
  if (event.photo_url) return event.photo_url;
  if (event.category_slug) {
    return getInitiativeCategoryDefaultImageUrl(event.category_slug);
  }
  return null;
}

function ParticipantsCounter({ count }: { count: number }) {
  if (count <= 0) return null;
  const Icon = CONTENT_ICONS.eventParticipants;
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="size-3 shrink-0 text-purple" aria-hidden />
      <span className="text-[10px] font-semibold text-muted">
        {count} participant{count !== 1 ? "s" : ""}
      </span>
    </div>
  );
}

function VolunteersGauge({
  registered,
  needed,
}: {
  registered: number;
  needed: number | null;
}) {
  if (!needed || needed <= 0) return null;
  const progress = Math.min(100, Math.round((registered / needed) * 100));
  const Icon = CONTENT_ICONS.eventVolunteers;

  return (
    <div className="mt-1 flex items-center gap-2">
      <Icon className="size-3 shrink-0 text-orange" aria-hidden />
      <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-orange transition-all"
          style={{
            width: `${Math.max(progress, registered > 0 ? 8 : 0)}%`,
          }}
        />
      </div>
      <span className="shrink-0 text-[10px] font-semibold text-orange">
        {registered}/{needed}
      </span>
    </div>
  );
}

function EventDateRangeLabel({ start, end }: { start: string; end: string }) {
  const parts = getEventRangeParts(start, end);

  return (
    <>
      {parts.map((part, index) => (
        <span
          key={index}
          className={
            part.variant === "connector"
              ? "font-medium text-orange/50"
              : "font-semibold text-orange"
          }
        >
          {part.text}
        </span>
      ))}
    </>
  );
}

export function EventCard({
  event: e,
  layout = "vertical",
  highlighted = false,
  hrefBuilder = ROUTES.evenements.detail,
  nudgeContent,
  priority = false,
}: Props) {
  const detailHref = hrefBuilder(e.id);
  const highlightRing = highlighted
    ? "border-orange ring-2 ring-orange/35 shadow-[0_12px_32px_rgba(255,179,71,0.15)]"
    : "";
  const imageUrl = resolveImageUrl(e);
  const volunteersRegistered = e.volunteers_registered ?? 0;
  const participantsCount = e.participants_count ?? 0;
  const showActionRequired =
    Boolean(nudgeContent) &&
    !e.suspended_at &&
    Boolean(getContentNudgeReason(nudgeContent!));

  if (layout === "horizontal") {
    return (
      <Link href={detailHref} className="block">
        <Card
          className={cn(
            "relative flex h-28 flex-row items-stretch gap-0 overflow-hidden rounded-lg p-0 transition hover:scale-[1.02]",
            contentActionRequiredCardBorder(
              showActionRequired,
              "hover:border-orange/45",
            ),
            highlightRing,
          )}
        >
          {showActionRequired && nudgeContent ? (
            <ContentActionRequiredBadge content={nudgeContent} />
          ) : null}
          <div className="relative size-28 shrink-0 overflow-hidden">
            {imageUrl ? (
              <CloudImage src={imageUrl} alt="" priority={priority} />
            ) : (
              <div className="flex size-full items-center justify-center bg-warm text-[10px] font-semibold text-muted">
                Événement
              </div>
            )}
          </div>
          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col p-2">
            {e.suspended_at ? <ContentSuspendedBadge /> : null}
            <div className="flex items-center gap-1">
              {e.category_slug ? (
                <CategoryTag
                  label={getInitiativeCategoryLabel(e.category_slug)}
                  colorHex={getInitiativeCategoryColorHex(e.category_slug)}
                  className="h-4 w-fit shrink-0 px-1.5 py-0 text-[10px] font-semibold leading-4"
                />
              ) : null}
            </div>
            <h3 className="my-1 truncate text-sm font-semibold leading-5 text-text">
              {e.title}
            </h3>
            <p className="flex items-center gap-1 text-[11px] font-medium text-orange">
              <CalendarDays className="size-3 shrink-0" aria-hidden />
              <time dateTime={e.starts_at} className="truncate">
                <EventDateRangeLabel start={e.starts_at} end={e.ends_at} />
              </time>
            </p>
            <ParticipantsCounter count={participantsCount} />
            <VolunteersGauge registered={volunteersRegistered} needed={e.volunteers_needed} />
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={detailHref} className="h-full">
      <Card
        className={cn(
          "flex h-full flex-col gap-0 rounded-xl p-0 transition hover:border-orange/45",
          highlightRing,
        )}
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          {imageUrl ? (
            <CloudImage src={imageUrl} alt="" priority={priority} />
          ) : (
            <div className="flex size-full items-center justify-center bg-warm text-[11px] font-semibold text-muted">
              Événement
            </div>
          )}
          {e.suspended_at ? <ContentSuspendedBadge /> : null}
        </div>

        <div className="relative flex flex-1 flex-col gap-1 px-2.5 pt-2.5 pb-2.5">
          <div className="flex items-center gap-2">
            {e.category_slug ? (
              <CategoryTag
                label={getInitiativeCategoryLabel(e.category_slug)}
                colorHex={getInitiativeCategoryColorHex(e.category_slug)}
                className="w-fit shrink-0"
              />
            ) : null}
          </div>

          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-text">
            {e.title}
          </h3>

          <p className="flex items-center gap-1 text-[11px] font-medium text-orange">
            <CalendarDays className="size-3.5 shrink-0" aria-hidden />
            <time dateTime={e.starts_at} className="truncate">
                <EventDateRangeLabel start={e.starts_at} end={e.ends_at} />
              </time>
          </p>

          {e.address_label ? (
            <div className="my-1 flex items-center gap-1 text-[11px] font-medium leading-snug text-subtle">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              <span className="min-w-0 truncate">{e.address_label}</span>
            </div>
          ) : null}
          <ParticipantsCounter count={participantsCount} />
          <VolunteersGauge registered={volunteersRegistered} needed={e.volunteers_needed} />
        </div>
      </Card>
    </Link>
  );
}

export function EventMapCard({ event: e }: { event: EventCardData }) {
  const imageUrl = resolveImageUrl(e);
  const volunteersRegistered = e.volunteers_registered ?? 0;
  const participantsCount = e.participants_count ?? 0;

  return (
    <div className="flex w-[260px] flex-col gap-2">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
        {imageUrl ? (
          <CloudImage src={imageUrl} alt="" />
        ) : (
          <div className="flex size-full items-center justify-center bg-warm text-xs font-semibold text-muted">
            Événement
          </div>
        )}
      </div>
      {e.category_slug ? (
        <CategoryTag
          label={getInitiativeCategoryLabel(e.category_slug)}
          colorHex={getInitiativeCategoryColorHex(e.category_slug)}
        />
      ) : null}
      <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-text">
        {e.title}
      </h3>
      <p className="flex items-center gap-1 text-[11px] font-medium text-orange">
        <CalendarDays className="size-3.5 shrink-0" aria-hidden />
        <EventDateRangeLabel start={e.starts_at} end={e.ends_at} />
      </p>
      {e.address_label ? (
        <p className="text-[11px] font-medium text-subtle">{e.address_label}</p>
      ) : null}
      <ParticipantsCounter count={participantsCount} />
      <VolunteersGauge registered={volunteersRegistered} needed={e.volunteers_needed} />
      <Link
        href={ROUTES.evenements.detail(e.id)}
        className="mt-1 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-sm gradient-events px-3 py-2 text-xs font-bold text-white shadow-card transition hover:opacity-95"
        aria-label="Voir l'événement"
      >
        <span>Voir l&apos;événement</span>
        <ArrowRight className="size-3.5" aria-hidden />
      </Link>
    </div>
  );
}
