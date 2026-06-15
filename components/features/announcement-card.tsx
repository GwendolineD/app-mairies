import Link from "next/link";
import { ArrowRight, HandHeart, Sparkles } from "lucide-react";
import { ROUTES } from "@/lib/constants/routes";
import {
  getCategoryColorHex,
  getCategoryLabel,
} from "@/lib/constants/announcement-categories";
import type { AnnouncementWithAuthor } from "@/lib/queries/announcements";
import { Card } from "@/components/ui/card";
import { CategoryTag } from "@/components/ui/category-tag";
import { cn } from "@/lib/utils/cn";
import { formatRelativeTime } from "@/lib/utils/date";

type Props = {
  announcement: AnnouncementWithAuthor;
  layout?: "vertical" | "horizontal";
  /** Visually highlights the card (eg. selected map marker). */
  highlighted?: boolean;
};

/** Coloured pill identifying offer vs request — overlays the card photo. */
function TypePastille({
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
            "flex gap-3 p-3 transition hover:border-purple/45",
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
          "flex h-full flex-col gap-2 p-3 transition hover:border-purple/45",
          highlightRing,
        )}
      >
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
        <div className="px-1">
          <CategoryTag
            label={getCategoryLabel(a.category_slug)}
            colorHex={getCategoryColorHex(a.category_slug)}
          />
        </div>
        <h3 className="px-1 line-clamp-2 text-sm font-semibold leading-5 text-text md:text-base md:leading-6">
          {a.title}
        </h3>
        <p className="mt-auto px-1 pb-1 text-[11px] font-medium text-subtle">
          {street} · {formatRelativeTime(a.created_at)}
        </p>
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
