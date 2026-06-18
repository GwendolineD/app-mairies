import Link from "next/link";
import { ArrowRight, Calendar, HandHeart, MapPin, Sparkles } from "lucide-react";
import { ROUTES } from "@/lib/constants/routes";
import {
  getCategoryColorHex,
  getCategoryLabel,
} from "@/lib/constants/announcement-categories";
import type { AnnouncementWithAuthor } from "@/lib/queries/announcements";
import { Card } from "@/components/ui/card";
import { CategoryTag } from "@/components/ui/category-tag";
import { cn } from "@/lib/utils/cn";
import { formatDisplayName } from "@/lib/utils/display-name";
import { formatRelativeTime } from "@/lib/utils/date";
import { formatShortDate } from "@/lib/utils/format-date";
import { formatAddressLabel, formatAddressLines, resolveAddressPostcode } from "@/lib/utils/format-address";

type Props = {
  announcement: AnnouncementWithAuthor;
  layout?: "vertical" | "horizontal";
  /** Visually highlights the card (eg. selected map marker). */
  highlighted?: boolean;
};

type AuthorProfile = {
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
} | null;

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

function AnnouncementTargetDate({
  targetDate,
  className,
}: {
  targetDate: string | null | undefined;
  className?: string;
}) {
  if (!targetDate) return null;

  return (
    <p
      className={cn(
        "flex items-center gap-1 text-[11px] font-medium leading-snug text-subtle",
        className,
      )}
    >
      <Calendar className="size-3.5 shrink-0" aria-hidden />
      <time dateTime={targetDate} className="min-w-0 truncate">
        Échéance le {formatShortDate(targetDate)}
      </time>
    </p>
  );
}

function resolveAnnouncementPostcode(
  announcement: AnnouncementWithAuthor,
): string | null {
  return resolveAddressPostcode(
    announcement.address_postcode,
    announcement.author_membership?.address_postcode,
  );
}

function AnnouncementCardAddress({
  street,
  postcode,
  city,
  fallbackPostcode,
}: {
  street: string | null | undefined;
  postcode: string | null | undefined;
  city: string | null | undefined;
  fallbackPostcode?: string | null;
}) {
  const resolvedPostcode = resolveAddressPostcode(postcode, fallbackPostcode);
  const { streetLine, cityLine, fallback } = formatAddressLines(
    street,
    resolvedPostcode,
    city,
  );

  const singleLine = fallback
    ? fallback
    : [streetLine, cityLine].filter(Boolean).join(", ");

  return (
    <div className="my-1 flex items-center gap-1 text-[11px] font-medium leading-snug text-subtle">
      <MapPin className="size-3.5 shrink-0" aria-hidden />
      <span className="min-w-0 truncate">{singleLine}</span>
    </div>
  );
}

export function TypePastille({
  type,
  className,
}: {
  type: string;
  className?: string;
}) {
  if (type !== "offre" && type !== "demande") return null;
  const isOffer = type === "offre";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-card",
        isOffer ? "gradient-offre" : "gradient-demande",
        className,
      )}
    >
      {isOffer ? (
        <Sparkles className="size-3" aria-hidden />
      ) : (
        <HandHeart className="size-3" aria-hidden />
      )}
      <span>{isOffer ? "Offre" : "Demande"}</span>
    </span>
  );
}

export function AnnouncementCard({
  announcement: a,
  layout = "vertical",
  highlighted = false,
}: Props) {
  const highlightRing = highlighted
    ? "border-purple ring-2 ring-purple/35 shadow-[0_12px_32px_rgba(154,82,255,0.15)]"
    : "";

  if (layout === "horizontal") {
    const fullAddress = formatAddressLabel(
      a.address_street,
      resolveAnnouncementPostcode(a),
      a.address_city,
    );

    return (
      <Link href={ROUTES.annonces.detail(a.id)} className="block">
        <Card
          className={cn(
            "flex h-28 flex-row items-stretch gap-0 overflow-hidden rounded-lg p-0 transition hover:border-purple/45",
            highlightRing,
          )}
        >
          <div className="relative size-28 shrink-0 overflow-hidden">
            {a.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={a.photo_url}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-warm text-[10px] font-semibold text-muted">
                Annonce
              </div>
            )}
          </div>
          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col p-2">
            <div className="flex items-center gap-1">
              <TypePastille
                type={a.type}
                className="h-4 gap-0.5 px-1.5 py-0 text-[10px] font-semibold leading-4 shadow-none [&_svg]:size-2.5"
              />
              <CategoryTag
                label={getCategoryLabel(a.category_slug)}
                colorHex={getCategoryColorHex(a.category_slug)}
                className="h-4 w-fit shrink-0 px-1.5 py-0 text-[10px] font-semibold leading-4"
              />
            </div>
            <h3 className="my-1 truncate text-sm font-semibold leading-5 text-text">
              {a.title}
            </h3>
            <AnnouncementTargetDate
              targetDate={a.target_date}
              className="text-[10px] leading-4"
            />
            <p className="flex items-center gap-1 truncate text-[10px] font-medium leading-4 text-subtle">
              <MapPin className="size-3 shrink-0" aria-hidden />
              <span className="truncate">{fullAddress}</span>
            </p>
            <div className="mt-auto flex items-center justify-between gap-1">
              <time
                className="shrink-0 text-[10px] leading-4 text-muted"
                dateTime={a.created_at}
              >
                {formatRelativeTime(a.created_at)}
              </time>
              <div className="flex min-w-0 items-center gap-1">
                {a.author_membership?.profiles?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.author_membership.profiles.avatar_url}
                    alt=""
                    className="size-4 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-4 shrink-0 items-center justify-center rounded-full bg-warm text-[8px] font-bold text-muted">
                    {resolveAuthorInitials(a.author_membership?.profiles ?? null)}
                  </div>
                )}
                <span className="truncate text-[10px] font-medium leading-4 text-muted">
                  {resolveAuthorName(a.author_membership?.profiles ?? null)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={ROUTES.annonces.detail(a.id)} className="h-full">
      <Card
        className={cn(
          "flex h-full flex-col gap-0 rounded-xl p-0 transition hover:border-purple/45",
          highlightRing,
        )}
      >
        <div className="relative">
          {a.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={a.photo_url}
              alt=""
              className="aspect-[16/10] w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[16/10] w-full items-center justify-center bg-warm text-[11px] font-semibold text-muted">
              Annonce
            </div>
          )}
          <TypePastille type={a.type} className="absolute left-2 top-2" />
        </div>

        <div className="flex flex-1 flex-col gap-1 px-2.5 pt-2.5 pb-2.5">
          <div className="flex items-center justify-between gap-2">
            <CategoryTag
              label={getCategoryLabel(a.category_slug)}
              colorHex={getCategoryColorHex(a.category_slug)}
              className="w-fit shrink-0"
            />
            <time
              className="shrink-0 text-[10px] font-medium text-subtle"
              dateTime={a.created_at}
            >
              {formatRelativeTime(a.created_at)}
            </time>
          </div>

          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-text">
            {a.title}
          </h3>

          <AnnouncementTargetDate targetDate={a.target_date} />

          <AnnouncementCardAddress
            street={a.address_street}
            postcode={a.address_postcode}
            city={a.address_city}
            fallbackPostcode={a.author_membership?.address_postcode}
          />

          <div className="mt-auto flex items-center justify-end gap-2">
            {a.author_membership?.profiles?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={a.author_membership.profiles.avatar_url}
                alt=""
                className="size-6 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-warm text-[10px] font-bold text-muted">
                {resolveAuthorInitials(a.author_membership?.profiles ?? null)}
              </div>
            )}
            <span className="truncate text-xs font-medium text-text">
              {resolveAuthorName(a.author_membership?.profiles ?? null)}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

/** Compact popover variant used by the map view. */
export function AnnouncementMapCard({
  announcement: a,
}: {
  announcement: AnnouncementWithAuthor;
}) {
  const street =
    a.author_membership?.address_street ??
    a.author_membership?.address_city ??
    "Adresse non renseignée";

  return (
    <div className="flex w-[260px] flex-col gap-2">
      <div className="relative">
        {a.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={a.photo_url}
            alt=""
            className="aspect-[4/3] w-full rounded-2xl object-cover"
          />
        ) : (
          <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-warm text-xs font-semibold text-muted">
            Annonce
          </div>
        )}
        <TypePastille type={a.type} className="absolute left-2 top-2" />
      </div>
      <CategoryTag
        label={getCategoryLabel(a.category_slug)}
        colorHex={getCategoryColorHex(a.category_slug)}
      />
      <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-text">
        {a.title}
      </h3>
      <p className="text-[11px] font-medium text-subtle">
        {street} · {formatRelativeTime(a.created_at)}
      </p>
      <Link
        href={ROUTES.annonces.detail(a.id)}
        className="mt-1 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-sm gradient-hero px-3 py-2 text-xs font-bold text-white shadow-card transition hover:opacity-95"
        aria-label="Voir l'annonce"
      >
        <span>Voir l&apos;annonce</span>
        <ArrowRight className="size-3.5" aria-hidden />
      </Link>
    </div>
  );
}
