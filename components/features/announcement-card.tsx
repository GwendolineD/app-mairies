import Link from "next/link";
import { formatStreetDisplay } from "@/lib/ban/display";
import { ROUTES } from "@/lib/constants/routes";
import { getCategoryLabel } from "@/lib/constants/announcement-categories";
import type { AnnouncementWithAuthor } from "@/lib/queries/announcements";
import { AnnouncementTypeTag } from "@/components/ui/announcement-type-tag";
import { Card } from "@/components/ui/card";
import { CategoryTag } from "@/components/ui/category-tag";
import { cn } from "@/lib/utils/cn";
import { formatRelativeTime } from "@/lib/utils/date";

type Props = {
  announcement: AnnouncementWithAuthor;
  layout?: "vertical" | "horizontal";
};

export function AnnouncementCard({ announcement: a, layout = "vertical" }: Props) {
  const street = formatStreetDisplay(a.author_membership?.address_label);

  if (layout === "horizontal") {
    return (
      <Link href={ROUTES.annonces.detail(a.id)} className="block">
        <Card className="flex gap-3 p-3 transition hover:border-purple/45">
          {a.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={a.photo_url}
              alt=""
              className="h-20 w-20 shrink-0 rounded-2xl object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-warm text-[10px] font-semibold text-muted">
              Annonce
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap gap-1">
              <AnnouncementTypeTag type={a.type} />
              <CategoryTag label={getCategoryLabel(a.category_slug)} />
            </div>
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
          "flex h-full flex-col space-y-2 p-5 transition hover:border-purple/45",
        )}
      >
        {a.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={a.photo_url}
            alt=""
            className="mb-1 aspect-video w-full rounded-2xl object-cover"
          />
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <AnnouncementTypeTag type={a.type} />
          <CategoryTag label={getCategoryLabel(a.category_slug)} />
        </div>
        <h3 className="text-xl font-semibold leading-7 text-text">{a.title}</h3>
        {a.description ? (
          <p className="line-clamp-2 text-sm font-medium leading-5 text-muted">
            {a.description}
          </p>
        ) : null}
        <p className="mt-auto text-xs font-medium text-subtle">
          {street} · {formatRelativeTime(a.created_at)}
        </p>
      </Card>
    </Link>
  );
}
