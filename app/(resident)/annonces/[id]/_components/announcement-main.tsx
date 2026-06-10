import { notFound } from "next/navigation";
import { getCategoryLabel } from "@/lib/constants/announcement-categories";
import {
  getAnnouncement,
  getAnnouncementAuthor,
} from "@/lib/data/announcements";
import { formatRelativeTime } from "@/lib/utils/date";
import { AnnouncementTypeTag } from "@/components/ui/announcement-type-tag";
import { AssetPlaceholder } from "@/components/ui/asset-placeholder";
import { Card } from "@/components/ui/card";
import { CategoryTag } from "@/components/ui/category-tag";
import { ReportButton } from "@/components/features/report-button";
import { AuthorAvatar } from "./author-avatar";

type Props = {
  id: string;
  communeId: string;
};

export async function AnnouncementMain({ id, communeId }: Props) {
  const ann = await getAnnouncement(id, communeId);
  if (!ann) notFound();

  const author = ann.author_membership
    ? await getAnnouncementAuthor(ann.author_membership.user_id)
    : null;

  return (
    <Card className="space-y-5 p-6">
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <AnnouncementTypeTag type={ann.type} />
            <CategoryTag label={getCategoryLabel(ann.category_slug)} />
          </div>
          <h1 className="text-[28px] font-bold leading-9 text-text">
            {ann.title}
          </h1>
          <div className="flex items-center gap-2.5">
            <AuthorAvatar
              name={author?.displayName ?? null}
              avatarUrl={author?.avatarUrl ?? null}
              className="h-9 w-9"
            />
            <div className="text-sm leading-tight">
              <p className="font-semibold text-text">
                {author?.displayName ?? "Voisin·e"}
              </p>
              <p className="text-xs text-muted">
                {formatRelativeTime(ann.created_at)}
              </p>
            </div>
          </div>
        </div>
        <ReportButton contextType="announcement" contextId={ann.id} />
      </header>

      {ann.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ann.photo_url}
          alt={ann.title}
          className="aspect-[16/10] w-full rounded-2xl border border-border object-cover"
        />
      ) : (
        <AssetPlaceholder
          description="Photo de l'annonce — illustration à venir"
          aspectRatio="16/10"
          className="rounded-2xl"
        />
      )}

      {ann.description ? (
        <p className="whitespace-pre-line text-base font-medium leading-6 text-text">
          {ann.description}
        </p>
      ) : (
        <p className="text-base font-medium italic text-muted">
          Pas de détail complémentaire.
        </p>
      )}
    </Card>
  );
}
