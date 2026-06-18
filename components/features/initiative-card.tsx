import Link from "next/link";
import { ArrowRight, CalendarDays, Heart, MapPin } from "lucide-react";
import { ROUTES } from "@/lib/constants/routes";
import {
  getInitiativeCategoryColorHex,
  getInitiativeCategoryLabel,
  getInitiativeCategoryDefaultImageUrl,
} from "@/lib/constants/initiative-categories";
import { Card } from "@/components/ui/card";
import { CategoryTag } from "@/components/ui/category-tag";
import { cn } from "@/lib/utils/cn";
import { formatDisplayName } from "@/lib/utils/display-name";
import { formatShortDate, formatRelativeTime } from "@/lib/utils/date";

export type InitiativeCardData = {
  id: string;
  title: string;
  description: string | null;
  photo_url: string | null;
  category_slug: string | null;
  address_label: string | null;
  created_at: string;
  support_count?: number;
  linked_event?: { id: string; starts_at: string } | null;
  author_membership?: {
    address_street?: string | null;
    address_city?: string | null;
    profiles?: {
      first_name?: string | null;
      last_name?: string | null;
      display_name?: string | null;
      avatar_url?: string | null;
    } | null;
  } | null;
};

type Props = {
  initiative: InitiativeCardData;
  layout?: "vertical" | "horizontal";
  highlighted?: boolean;
};

type AuthorProfile = InitiativeCardData["author_membership"] extends infer M
  ? M extends { profiles?: infer P }
    ? P
    : null
  : null;

function resolveAuthorName(profiles: AuthorProfile): string {
  if (profiles?.first_name && profiles?.last_name) {
    return formatDisplayName(profiles.first_name, profiles.last_name);
  }
  return profiles?.display_name ?? profiles?.first_name ?? "Anonyme";
}

function resolveAuthorInitials(profiles: AuthorProfile): string {
  const first = profiles?.first_name?.trim().charAt(0).toUpperCase();
  const last = profiles?.last_name?.trim().charAt(0).toUpperCase();
  if (first && last) return `${first}${last}`;
  if (first) return first;
  const fromDisplay = profiles?.display_name?.trim().charAt(0).toUpperCase();
  return fromDisplay ?? "?";
}

function resolveImageUrl(initiative: InitiativeCardData): string | null {
  if (initiative.photo_url) return initiative.photo_url;
  if (initiative.category_slug) {
    return getInitiativeCategoryDefaultImageUrl(initiative.category_slug);
  }
  return null;
}

function resolveAddress(initiative: InitiativeCardData): string {
  if (initiative.address_label) return initiative.address_label;
  const street = initiative.author_membership?.address_street;
  const city = initiative.author_membership?.address_city;
  return street ?? city ?? "Adresse non renseignée";
}

function LinkedEventDate({ startsAt }: { startsAt: string }) {
  return (
    <p className="flex min-w-0 items-center gap-1 text-[11px] font-medium text-subtle">
      <CalendarDays className="size-3.5 shrink-0" aria-hidden />
      <time dateTime={startsAt} className="truncate">
        Événement le {formatShortDate(startsAt)}
      </time>
    </p>
  );
}

function SupportBadge({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "flex items-center gap-1 font-semibold text-purple",
        className,
      )}
    >
      <Heart className="size-3.5 fill-purple" aria-hidden />
      {count}
    </span>
  );
}

export function InitiativeCard({
  initiative: i,
  layout = "vertical",
  highlighted = false,
}: Props) {
  const highlightRing = highlighted
    ? "border-purple ring-2 ring-purple/35 shadow-[0_12px_32px_rgba(154,82,255,0.15)]"
    : "";
  const imageUrl = resolveImageUrl(i);
  const address = resolveAddress(i);
  const supportCount = i.support_count ?? 0;
  const profiles = i.author_membership?.profiles ?? null;

  if (layout === "horizontal") {
    return (
      <Link href={ROUTES.initiatives.detail(i.id)} className="block">
        <Card
          className={cn(
            "flex h-28 flex-row items-stretch gap-0 overflow-hidden rounded-lg p-0 transition hover:scale-[1.02] hover:border-purple/45",
            highlightRing,
          )}
        >
          <div className="relative size-28 shrink-0 overflow-hidden">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center bg-warm text-[10px] font-semibold text-muted">
                Initiative
              </div>
            )}
          </div>
          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col p-2">
            <SupportBadge
              count={supportCount}
              className="absolute right-2 top-2 text-xs [&_svg]:size-3.5"
            />
            <div className="flex items-center gap-1">
              {i.category_slug ? (
                <CategoryTag
                  label={getInitiativeCategoryLabel(i.category_slug)}
                  colorHex={getInitiativeCategoryColorHex(i.category_slug)}
                  className="h-4 w-fit shrink-0 px-1.5 py-0 text-[10px] font-semibold leading-4"
                />
              ) : null}
            </div>
            <h3 className="my-1 truncate text-sm font-semibold leading-5 text-text">
              {i.title}
            </h3>
            {i.linked_event?.starts_at ? (
              <LinkedEventDate startsAt={i.linked_event.starts_at} />
            ) : null}
            <p className="flex items-center gap-1 truncate text-[10px] font-medium leading-4 text-subtle">
              <MapPin className="size-3 shrink-0" aria-hidden />
              <span className="truncate">{address}</span>
            </p>
            <div className="mt-auto flex items-center justify-between gap-1">
              <div className="flex min-w-0 items-center gap-1">
                {profiles?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profiles.avatar_url}
                    alt=""
                    className="size-4 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-4 shrink-0 items-center justify-center rounded-full bg-warm text-[8px] font-bold text-muted">
                    {resolveAuthorInitials(profiles)}
                  </div>
                )}
                <span className="truncate text-[10px] font-medium leading-4 text-muted">
                  {resolveAuthorName(profiles)}
                </span>
              </div>
              <time
                className="shrink-0 text-[10px] leading-4 text-muted"
                dateTime={i.created_at}
              >
                {formatRelativeTime(i.created_at)}
              </time>
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={ROUTES.initiatives.detail(i.id)} className="h-full">
      <Card
        className={cn(
          "flex h-full flex-col gap-0 rounded-xl p-0 transition hover:border-purple/45",
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
              Initiative
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1 px-2.5 pt-2.5 pb-2.5">
          <div className="flex items-center justify-between gap-2">
            {i.category_slug ? (
              <CategoryTag
                label={getInitiativeCategoryLabel(i.category_slug)}
                colorHex={getInitiativeCategoryColorHex(i.category_slug)}
                className="w-fit shrink-0"
              />
            ) : null}
            <time
              className="shrink-0 text-[10px] font-medium text-subtle"
              dateTime={i.created_at}
            >
              {formatRelativeTime(i.created_at)}
            </time>
          </div>

          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-text">
            {i.title}
          </h3>

          {i.linked_event?.starts_at ? (
            <LinkedEventDate startsAt={i.linked_event.starts_at} />
          ) : null}

          <div className="my-1 flex items-center gap-1 text-[11px] font-medium leading-snug text-subtle">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            <span className="min-w-0 truncate">{address}</span>
          </div>

          <div className="mt-auto flex items-center gap-2">
            <SupportBadge count={supportCount} className="text-xs" />
            <div className="ml-auto flex min-w-0 items-center gap-2">
              {profiles?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profiles.avatar_url}
                  alt=""
                  className="size-6 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-warm text-[10px] font-bold text-muted">
                  {resolveAuthorInitials(profiles)}
                </div>
              )}
              <span className="truncate text-xs font-medium text-text">
                {resolveAuthorName(profiles)}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export function InitiativeMapCard({
  initiative: i,
}: {
  initiative: InitiativeCardData;
}) {
  const imageUrl = resolveImageUrl(i);
  const address = resolveAddress(i);

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
            Initiative
          </div>
        )}
      </div>
      {i.category_slug ? (
        <CategoryTag
          label={getInitiativeCategoryLabel(i.category_slug)}
          colorHex={getInitiativeCategoryColorHex(i.category_slug)}
        />
      ) : null}
      <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-text">
        {i.title}
      </h3>
      <p className="text-[11px] font-medium text-subtle">
        {address} · {formatRelativeTime(i.created_at)}
      </p>
      <Link
        href={ROUTES.initiatives.detail(i.id)}
        className="mt-1 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-sm gradient-initiative px-3 py-2 text-xs font-bold text-white shadow-card transition hover:opacity-95"
        aria-label="Voir l'initiative"
      >
        <span>Voir l&apos;initiative</span>
        <ArrowRight className="size-3.5" aria-hidden />
      </Link>
    </div>
  );
}
