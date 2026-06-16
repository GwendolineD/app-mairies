import Link from "next/link";
import { ArrowRight, HandHeart, MapPin, Sparkles } from "lucide-react";
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
import { formatAddressLines } from "@/lib/utils/format-address";

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

function AnnouncementCardAddress({
  street,
  postcode,
  city,
}: {
  street: string | null | undefined;
  postcode: string | null | undefined;
  city: string | null | undefined;
}) {
  const { streetLine, cityLine, fallback } = formatAddressLines(
    street,
    postcode,
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
  const street =
    a.author_membership?.address_street ??
    a.author_membership?.address_city ??
    "Adresse non renseignée";

  const highlightRing = highlighted
    ? "border-purple ring-2 ring-purple/35 shadow-[0_12px_32px_rgba(154,82,255,0.15)]"
    : "";

  if (layout === "horizontal") {
    return (
      <Link href={ROUTES.annonces.detail(a.id)} className="block">
        <Card
          className={cn(
            "flex gap-3 rounded-xl p-3 transition hover:border-purple/45",
            highlightRing,
          )}
        >
          <div className="relative shrink-0">
            {a.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={a.photo_url}
                alt=""
                className="h-20 w-20 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-warm text-[10px] font-semibold text-muted">
                Annonce
              </div>
            )}
            <TypePastille type={a.type} className="absolute left-1 top-1 px-1.5 py-0.5 text-[9px]" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <CategoryTag
              label={getCategoryLabel(a.category_slug)}
              colorHex={getCategoryColorHex(a.category_slug)}
            />
            <h3 className="line-clamp-2 text-base font-semibold text-text">{a.title}</h3>
            <p className="text-xs text-muted">
              {street} · {formatRelativeTime(a.created_at)}
            </p>
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

          <AnnouncementCardAddress
            street={a.address_street}
            postcode={a.address_postcode}
            city={a.address_city}
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
