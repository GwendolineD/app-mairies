"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { useCreationModals } from "@/components/features/creation-modal-context";
import { ContactAnnouncementButton } from "@/components/features/contact-announcement-button";
import { DeleteInitiativeModal } from "@/components/features/delete-initiative-modal";
import { SupportInitiativeButton } from "@/components/features/support-initiative-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ROUTES } from "@/lib/constants/routes";
import type { InitiativeEditData } from "@/lib/types";
import { formatLinkedEventDateTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";

type LinkedEvent = {
  id: string;
  title: string;
  starts_at: string | null;
};

type Props = {
  isAuthor: boolean;
  initiativeId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  memberSince: string;
  initialSupported: boolean;
  initialSupportCount: number;
  editData?: InitiativeEditData;
  linkedEvent?: LinkedEvent | null;
  className?: string;
};

function SupportCountLabel({ count }: { count: number }) {
  return (
    <p className="text-base font-bold text-text">
      {count} soutien{count !== 1 ? "s" : ""}
    </p>
  );
}

function InitiativeLinkedEventCard({
  event,
  className,
}: {
  event: LinkedEvent;
  className?: string;
}) {
  return (
    <Card className={cn("relative space-y-2 md:p-5", className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase text-mint">
          Événement associé
        </p>
        <Link
          href={ROUTES.evenements.detail(event.id)}
          className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-sm text-muted transition hover:bg-warm hover:text-text"
          aria-label={`Voir l'événement : ${event.title}`}
        >
          <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      </div>
      <p className="text-sm font-semibold text-text">{event.title}</p>
      {event.starts_at ? (
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
          <CalendarDays className="size-3.5 shrink-0 text-coral" aria-hidden />
          <time dateTime={event.starts_at}>
            {formatLinkedEventDateTime(event.starts_at)}
          </time>
        </p>
      ) : null}
    </Card>
  );
}

function AuthorActionsCard({
  initiativeId,
  editData,
  className,
}: {
  initiativeId: string;
  editData?: InitiativeEditData;
  className?: string;
}) {
  const { openInitiativeModal } = useCreationModals();
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <Card className={cn("space-y-4 md:p-5", className)}>
      <h2 className="text-lg font-semibold text-text">Votre initiative</h2>
      <p className="text-sm font-medium text-muted">
        Gérez votre idée et suivez l&apos;engagement des voisin·es.
      </p>
      <Button
        type="button"
        className="w-full cursor-pointer"
        onClick={() =>
          openInitiativeModal({ editId: initiativeId, initialData: editData })
        }
      >
        <Pencil className="size-4" aria-hidden />
        Modifier l&apos;initiative
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full cursor-pointer border-coral bg-surface text-coral hover:bg-coral/5"
        onClick={() => setDeleteOpen(true)}
      >
        <Trash2 className="size-4" aria-hidden />
        Supprimer
      </Button>
      <DeleteInitiativeModal
        initiativeId={initiativeId}
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
      />
    </Card>
  );
}

function SupportCard({
  isAuthor,
  initiativeId,
  initialSupported,
  initialSupportCount,
  className,
}: {
  isAuthor: boolean;
  initiativeId: string;
  initialSupported: boolean;
  initialSupportCount: number;
  className?: string;
}) {
  if (isAuthor) {
    return (
      <Card className={cn("space-y-3 md:p-5", className)}>
        <h2 className="text-lg font-semibold text-text">Soutiens</h2>
        <p className="text-sm font-medium text-muted">
          Des habitants trouvent votre idée intéressante pour la commune.
        </p>
        <SupportCountLabel count={initialSupportCount} />
      </Card>
    );
  }

  return (
    <Card className={cn("space-y-3 md:p-5", className)}>
      <h2 className="text-lg font-semibold text-text">Soutien</h2>
      <p className="text-sm font-medium text-muted">
        Vous trouvez cette idée intéressante pour la commune ?
      </p>
      <SupportInitiativeButton
        initiativeId={initiativeId}
        initialSupported={initialSupported}
        initialCount={initialSupportCount}
        hideCountInLabel
        className="w-full"
      />
    </Card>
  );
}

export function InitiativeSidebarActions({
  isAuthor,
  initiativeId,
  authorName,
  authorAvatarUrl,
  memberSince,
  initialSupported,
  initialSupportCount,
  editData,
  linkedEvent,
  className,
}: Props) {
  const contactLabel = `Contacter ${authorName.split(" ")[0]}`;

  return (
    <>
      {isAuthor ? (
        <AuthorActionsCard
          initiativeId={initiativeId}
          editData={editData}
          className={className}
        />
      ) : (
        <>
          <div className="space-y-4 md:hidden">
            <Card className={cn("space-y-4 p-4", className)}>
              <h2 className="text-lg font-semibold text-text">Contact</h2>
              <div className="flex items-center gap-3">
                <UserAvatar name={authorName} url={authorAvatarUrl} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text">
                    {authorName}
                  </p>
                  <p className="text-xs text-muted">{memberSince}</p>
                </div>
              </div>
              <ContactAnnouncementButton
                contextId={initiativeId}
                contextType="initiative"
                label={contactLabel}
                icon={<MessageCircle className="size-4" aria-hidden />}
                className="py-4"
              />
            </Card>
          </div>

          <Card className={cn("hidden space-y-4 md:block md:p-5", className)}>
            <h2 className="text-lg font-semibold text-text">Contact</h2>
            <div className="flex items-center gap-3">
              <UserAvatar name={authorName} url={authorAvatarUrl} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-text">
                  {authorName}
                </p>
                <p className="text-xs text-muted">{memberSince}</p>
              </div>
            </div>
            <ContactAnnouncementButton
              contextId={initiativeId}
              contextType="initiative"
              label={contactLabel}
              icon={<MessageCircle className="size-4" aria-hidden />}
            />
          </Card>
        </>
      )}

      <SupportCard
        isAuthor={isAuthor}
        initiativeId={initiativeId}
        initialSupported={initialSupported}
        initialSupportCount={initialSupportCount}
        className={className}
      />

      {linkedEvent ? (
        <InitiativeLinkedEventCard event={linkedEvent} className={className} />
      ) : null}
    </>
  );
}
