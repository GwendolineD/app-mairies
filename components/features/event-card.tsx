import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Users } from "lucide-react";
import { ROUTES } from "@/lib/constants/routes";
import {
  getInitiativeCategoryColorHex,
  getInitiativeCategoryLabel,
  getInitiativeCategoryDefaultImageUrl,
} from "@/lib/constants/initiative-categories";
import { Card } from "@/components/ui/card";
import { CategoryTag } from "@/components/ui/category-tag";
import { cn } from "@/lib/utils/cn";
import { getEventRangeParts } from "@/lib/utils/date";
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
> & {
  volunteers_registered?: number;
};

type Props = {
  event: EventCardData;
  layout?: "vertical" | "horizontal";
  highlighted?: boolean;
};

function resolveImageUrl(event: EventCardData): string | null {
  if (event.photo_url) return event.photo_url;
  if (event.category_slug) {
    return getInitiativeCategoryDefaultImageUrl(event.category_slug);
  }
  return null;
}

function VolunteersBadge({
  registered,
  needed,
}: {
  registered: number;
  needed: number | null;
}) {
  if (!needed || needed <= 0) return null;
  return (
    <span className="flex items-center gap-0.5 text-[10px] font-semibold text-orange">
      <Users className="size-3" aria-hidden />
      {registered}/{needed} bénévole{needed !== 1 ? "s" : ""}
    </span>
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
}: Props) {
  const highlightRing = highlighted
    ? "border-orange ring-2 ring-orange/35 shadow-[0_12px_32px_rgba(255,179,71,0.15)]"
    : "";
  const imageUrl = resolveImageUrl(e);
  const volunteersRegistered = e.volunteers_registered ?? 0;

  if (layout === "horizontal") {
    return (
      <Link href={ROUTES.evenements.detail(e.id)} className="block">
        <Card
          className={cn(
            "flex h-28 flex-row items-stretch gap-0 overflow-hidden rounded-lg p-0 transition hover:border-orange/45",
            highlightRing,
          )}
        >
          <div className="relative size-28 shrink-0 overflow-hidden">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center bg-warm text-[10px] font-semibold text-muted">
                Événement
              </div>
            )}
          </div>
          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col p-2">
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
            {e.address_label ? (
              <p className="flex items-center gap-1 truncate text-[10px] font-medium leading-4 text-subtle">
                <MapPin className="size-3 shrink-0" aria-hidden />
                <span className="truncate">{e.address_label}</span>
              </p>
            ) : null}
            <div className="mt-auto flex items-center justify-end">
              <VolunteersBadge registered={volunteersRegistered} needed={e.volunteers_needed} />
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={ROUTES.evenements.detail(e.id)} className="h-full">
      <Card
        className={cn(
          "flex h-full flex-col gap-0 rounded-xl p-0 transition hover:border-orange/45",
          highlightRing,
        )}
      >
        <div className="relative">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt=""
              className="aspect-[16/10] w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[16/10] w-full items-center justify-center bg-warm text-[11px] font-semibold text-muted">
              Événement
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1 px-2.5 pt-2.5 pb-2.5">
          <div className="flex items-center justify-between gap-2">
            {e.category_slug ? (
              <CategoryTag
                label={getInitiativeCategoryLabel(e.category_slug)}
                colorHex={getInitiativeCategoryColorHex(e.category_slug)}
                className="w-fit shrink-0"
              />
            ) : null}
            <VolunteersBadge registered={volunteersRegistered} needed={e.volunteers_needed} />
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
        </div>
      </Card>
    </Link>
  );
}

export function EventMapCard({ event: e }: { event: EventCardData }) {
  const imageUrl = resolveImageUrl(e);

  return (
    <div className="flex w-[260px] flex-col gap-2">
      <div className="relative">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            className="aspect-[4/3] w-full rounded-2xl object-cover"
          />
        ) : (
          <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-warm text-xs font-semibold text-muted">
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
