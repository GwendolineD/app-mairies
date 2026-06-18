"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  CalendarPlus,
  Heart,
  MessageCircle,
  Pencil,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useCreationModals } from "@/components/features/creation-modal-context";
import { ContactAnnouncementButton } from "@/components/features/contact-announcement-button";
import { DeleteInitiativeModal } from "@/components/features/delete-initiative-modal";
import { SupportInitiativeButton } from "@/components/features/support-initiative-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ROUTES } from "@/lib/constants/routes";
import type { EventEditData, InitiativeEditData } from "@/lib/types";
import type { InitiativeSupporter } from "@/lib/queries/initiatives";
import { formatLinkedEventDateTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import { SupportersAvatarRow } from "@/components/features/initiative-supporters-list";

type LinkedEvent = {
  id: string;
  title: string;
  starts_at: string | null;
  ends_at: string | null;
};

type Props = {
  isAuthor: boolean;
  initiativeId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  memberSince: string;
  initialSupported: boolean;
  initialSupportCount: number;
  supporters: InitiativeSupporter[];
  editData?: InitiativeEditData;
  linkedEvent?: LinkedEvent | null;
  className?: string;
};

function getAuthorSupportMessage(count: number) {
  if (count === 0) {
    return "C'est un beau projet pour la commune — les premiers soutiens arriveront bientôt, continuez à le faire vivre !";
  }

  return "Bravo, votre idée mobilise déjà des voisin·es autour de vous !";
}

function SupportCountLabel({ count }: { count: number }) {
  return (
    <p className="flex items-center justify-center gap-1.5 text-base font-bold text-text">
      {count} soutien{count !== 1 ? "s" : ""}
      <Heart className="size-4 shrink-0 fill-coral text-coral" aria-hidden />
    </p>
  );
}

function SupportersSection({
  initiativeId,
  initialSupportCount,
  supporters,
  isAuthor,
}: {
  initiativeId: string;
  initialSupportCount: number;
  supporters: InitiativeSupporter[];
  isAuthor: boolean;
}) {
  return (
    <div className="space-y-3">
      <SupportCountLabel count={initialSupportCount} />
      {supporters.length > 0 ? (
        <SupportersAvatarRow
          supporters={supporters}
          initiativeId={initiativeId}
          isAuthor={isAuthor}
        />
      ) : null}
    </div>
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
    <Card className={cn("relative space-y-3 md:p-5", className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex min-w-0 items-center gap-2 text-lg font-semibold text-text">
          <CalendarDays className="size-5 shrink-0 text-coral/85" aria-hidden />
          Événement associé
        </h2>
        <Link
          href={ROUTES.evenements.detail(event.id)}
          className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-sm text-muted transition hover:bg-warm hover:text-text"
          aria-label={`Voir l'événement : ${event.title}`}
        >
          <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-text">{event.title}</p>
        {event.starts_at && event.ends_at ? (
          <p className="text-xs font-medium text-muted">
            <time dateTime={event.starts_at}>
              {formatLinkedEventDateTime(event.starts_at, event.ends_at)}
            </time>
          </p>
        ) : null}
      </div>
    </Card>
  );
}

function AuthorActionsCard({
  initiativeId,
  editData,
  linkedEvent,
  className,
}: {
  initiativeId: string;
  editData?: InitiativeEditData;
  linkedEvent?: LinkedEvent | null;
  className?: string;
}) {
  const { openInitiativeModal, openEventModal } = useCreationModals();
  const [deleteOpen, setDeleteOpen] = useState(false);

  function handleTransformToEvent() {
    if (!editData) return;
    const eventData: EventEditData = {
      categorySlug: editData.categorySlug,
      title: editData.title,
      description: editData.description,
      photoUrl: editData.photoUrl,
      startsAt: "",
      endsAt: "",
      volunteersNeeded: null,
      addressStreet: editData.addressStreet,
      addressCity: editData.addressCity,
      addressCitycode: editData.addressCitycode,
      addressPostcode: editData.addressPostcode,
      addressLat: editData.addressLat,
      addressLng: editData.addressLng,
      sourceInitiativeId: initiativeId,
    };
    openEventModal({ initialData: eventData });
  }

  return (
    <Card className={cn("gap-6 md:p-5", className)}>
      <div className="space-y-1">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-text">
          <Sparkles className="size-5 shrink-0 text-mint" aria-hidden />
          Gérez votre initiative
        </h2>
        <p className="text-sm font-medium text-muted">
          Suivez l&apos;engagement des voisin·es et faites évoluer votre idée.
        </p>
      </div>
      <div className="flex flex-col gap-2">
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
        {!linkedEvent ? (
          <Button
            type="button"
            variant="outline"
            className="w-full cursor-pointer border-orange bg-surface text-orange hover:bg-orange/5"
            onClick={handleTransformToEvent}
          >
            <CalendarPlus className="size-4" aria-hidden />
            Transformer en événement
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="w-full cursor-pointer border-coral bg-surface text-coral hover:bg-coral/5"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="size-4" aria-hidden />
          Supprimer
        </Button>
      </div>
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
  supporters,
  className,
}: {
  isAuthor: boolean;
  initiativeId: string;
  initialSupported: boolean;
  initialSupportCount: number;
  supporters: InitiativeSupporter[];
  className?: string;
}) {
  if (isAuthor) {
    return (
      <Card className={cn("gap-6 md:p-5", className)}>
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-text">
            <Heart className="size-5 shrink-0 text-coral/85" aria-hidden />
            Soutiens
          </h2>
          <p className="text-sm font-medium text-muted">
            {getAuthorSupportMessage(initialSupportCount)}
          </p>
        </div>
        <SupportersSection
          initiativeId={initiativeId}
          initialSupportCount={initialSupportCount}
          supporters={supporters}
          isAuthor={isAuthor}
        />
      </Card>
    );
  }

  return (
    <Card className={cn("space-y-3 md:p-5", className)}>
      <div className="space-y-1">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-text">
          <Heart className="size-5 shrink-0 text-coral/85" aria-hidden />
          Soutien
        </h2>
        <p className="text-sm font-medium text-muted">
          Vous trouvez cette idée intéressante pour la commune ? Soutenez-la !
        </p>
      </div>
      <SupportersSection
        initiativeId={initiativeId}
        initialSupportCount={initialSupportCount}
        supporters={supporters}
        isAuthor={isAuthor}
      />
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
  supporters,
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
          linkedEvent={linkedEvent}
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
        supporters={supporters}
        className={className}
      />

      {linkedEvent ? (
        <InitiativeLinkedEventCard event={linkedEvent} className={className} />
      ) : null}
    </>
  );
}
