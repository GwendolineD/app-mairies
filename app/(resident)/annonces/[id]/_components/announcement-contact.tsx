import {
  getAnnouncement,
  getAnnouncementAuthor,
} from "@/lib/data/announcements";
import { formatMonthYear } from "@/lib/utils/date";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ContactAnnouncementButton } from "@/components/features/contact-announcement-button";
import { AuthorAvatar } from "./author-avatar";

type Props = {
  id: string;
  communeId: string;
  viewerMembershipId: string;
};

export async function AnnouncementContact({
  id,
  communeId,
  viewerMembershipId,
}: Props) {
  const ann = await getAnnouncement(id, communeId);
  if (!ann || !ann.author_membership) return null;

  const author = await getAnnouncementAuthor(ann.author_membership.user_id);
  const displayName = author?.displayName ?? "Voisin·e";
  const memberSince = formatMonthYear(ann.author_membership.created_at);
  const isAuthor = ann.author_membership.id === viewerMembershipId;

  return (
    <Card className="space-y-4 p-6">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-subtle">
        Contact
      </h2>
      <div className="flex items-center gap-3">
        <AuthorAvatar
          name={displayName}
          avatarUrl={author?.avatarUrl ?? null}
          className="h-11 w-11"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text">
            {displayName}
          </p>
          {memberSince ? (
            <p className="text-xs text-muted">Membre depuis {memberSince}</p>
          ) : null}
        </div>
      </div>
      {isAuthor ? (
        <p className="rounded-2xl bg-warm px-4 py-3 text-sm font-medium text-muted">
          C&apos;est votre annonce : les messages reçus apparaîtront dans
          l&apos;onglet Messages.
        </p>
      ) : (
        <ContactAnnouncementButton
          contextId={ann.id}
          contextType="announcement"
          label={`Contacter ${displayName.split(/\s+/)[0]}`}
        />
      )}
      <Button variant="secondary" disabled className="w-full">
        Voir le profil
      </Button>
    </Card>
  );
}
