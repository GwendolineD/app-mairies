import { MessageCircle } from "lucide-react";
import { ROUTES } from "@/lib/constants/routes";
import {
  getAnnouncement,
  getAnnouncementAuthor,
} from "@/lib/data/announcements";
import { formatMonthYear } from "@/lib/utils/date";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GradientButton } from "@/components/ui/gradient-button";
import { AuthorAvatar } from "./author-avatar";

type Props = {
  id: string;
  communeId: string;
};

export async function AnnouncementContact({ id, communeId }: Props) {
  const ann = await getAnnouncement(id, communeId);
  if (!ann || !ann.author_membership) return null;

  const author = await getAnnouncementAuthor(ann.author_membership.user_id);
  const displayName = author?.displayName ?? "Voisin·e";
  const firstName = displayName.split(/\s+/)[0];
  const memberSince = formatMonthYear(ann.author_membership.created_at);

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
      <GradientButton href={ROUTES.messages} className="w-full">
        <MessageCircle className="h-4 w-4" aria-hidden />
        Contacter {firstName}
      </GradientButton>
      <Button variant="secondary" disabled className="w-full">
        Voir le profil
      </Button>
    </Card>
  );
}
