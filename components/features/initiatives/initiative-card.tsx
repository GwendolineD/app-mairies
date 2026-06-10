import Link from "next/link";
import { ROUTES } from "@/lib/constants/routes";
import { getContentCategoryLabel } from "@/lib/constants/content-categories";
import { formatInitiativeWhen } from "@/lib/utils/date";
import { Card } from "@/components/ui/card";
import { CategoryTag } from "@/components/ui/category-tag";
import type { InitiativeRecord } from "@/lib/types";

/** Compact initiative tile used on the list page. */
export function InitiativeCard({ initiative }: { initiative: InitiativeRecord }) {
  const when = formatInitiativeWhen(
    initiative.date_mode,
    initiative.single_starts_at,
  );

  return (
    <Link
      href={ROUTES.initiatives.detail(initiative.id)}
      className="h-full"
      prefetch
    >
      <Card className="flex h-full flex-col overflow-hidden p-0 transition hover:border-mint/50">
        <InitiativeThumbnail
          photoUrl={initiative.photo_url}
          title={initiative.title}
        />
        <div className="flex flex-1 flex-col gap-2 p-5">
          <CategoryTag
            label={getContentCategoryLabel(initiative.category_slug)}
            className="self-start bg-mint/10 text-mint"
          />
          <h3 className="text-xl font-semibold leading-7 text-text">
            {initiative.title}
          </h3>
          {initiative.description ? (
            <p className="line-clamp-2 text-sm font-medium leading-5 text-muted">
              {initiative.description}
            </p>
          ) : (
            <p className="text-sm font-medium italic text-subtle">
              Invitation ouverte : voyez les détails.
            </p>
          )}
          <p className="mt-auto flex items-center gap-1.5 pt-1 text-xs font-semibold text-muted">
            <CalendarDot />
            {when}
          </p>
        </div>
      </Card>
    </Link>
  );
}

function InitiativeThumbnail({
  photoUrl,
  title,
}: {
  photoUrl: string | null;
  title: string;
}) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={title}
        loading="lazy"
        className="aspect-[16/10] w-full object-cover"
      />
    );
  }
  return (
    <div className="flex aspect-[16/10] w-full items-center justify-center gradient-initiative">
      <span className="text-2xl font-bold text-white/90">✦</span>
    </div>
  );
}

function CalendarDot() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
