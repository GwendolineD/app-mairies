import Link from "next/link";
import { ROUTES } from "@/lib/constants/routes";
import {
  getAnnouncement,
  getSimilarAnnouncements,
} from "@/lib/data/announcements";
import { getCategoryLabel } from "@/lib/constants/announcement-categories";
import { formatRelativeTime } from "@/lib/utils/date";
import { Card } from "@/components/ui/card";

type Props = {
  id: string;
  communeId: string;
};

export async function SimilarAnnouncements({ id, communeId }: Props) {
  const ann = await getAnnouncement(id, communeId);
  if (!ann) return null;

  const similar = await getSimilarAnnouncements({
    communeId,
    categorySlug: ann.category_slug,
    excludeId: ann.id,
  });

  if (similar.length === 0) return null;

  return (
    <Card className="space-y-4 p-6">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-subtle">
        Annonces similaires
      </h2>
      <ul className="space-y-3">
        {similar.map((item) => (
          <li key={item.id}>
            <Link
              href={ROUTES.annonces.detail(item.id)}
              className="group flex items-center gap-3 rounded-lg transition hover:bg-warm"
            >
              {item.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.photo_url}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-lg border border-border object-cover"
                />
              ) : (
                <span
                  className="h-14 w-14 shrink-0 rounded-lg bg-soft-pink"
                  aria-hidden
                />
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-text group-hover:text-purple">
                  {item.title}
                </p>
                <p className="truncate text-xs text-muted">
                  {getCategoryLabel(item.category_slug)} ·{" "}
                  {formatRelativeTime(item.created_at)}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
