"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  CalendarCheck,
  CalendarDays,
  Copy,
  MessageCircle,
  Pencil,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { ContactAnnouncementButton } from "@/components/features/contact-announcement-button";
import { useCreationModals } from "@/components/features/creation-modal-context";
import { EventParticipantButton } from "@/components/features/event-participant-button";
import { ParticipantsAvatarRow } from "@/components/features/event-participants-list";
import { VolunteersAvatarRow } from "@/components/features/event-volunteers-list";
import { EventVolunteerButton } from "@/components/features/event-volunteer-button";
import { deleteEvent } from "@/lib/actions/events";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ROUTES } from "@/lib/constants/routes";
import type { EventVolunteer } from "@/lib/queries/events";
import type { EventEditData } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

type SourceInitiative = {
  id: string;
  title: string;
};

type Props = {
  isAuthor: boolean;
  eventId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  memberSince: string;
  volunteersNeeded: number | null;
  volunteersRegistered?: number;
  volunteers?: EventVolunteer[];
  initialVolunteering?: boolean;
  participantsCount?: number;
  participants?: EventVolunteer[];
  initialParticipating?: boolean;
  editData?: EventEditData;
  sourceInitiative?: SourceInitiative | null;
  className?: string;
  deleteRedirectHref?: string;
};

export function EventSidebarActions({
  isAuthor,
  eventId,
  authorName,
  authorAvatarUrl,
  memberSince,
  volunteersNeeded,
  volunteersRegistered = 0,
  volunteers = [],
  initialVolunteering = false,
  participantsCount = 0,
  participants = [],
  initialParticipating = false,
  editData,
  sourceInitiative,
  className,
  deleteRedirectHref = ROUTES.evenements.list,
}: Props) {
  const contactLabel = `Contacter ${authorName.split(" ")[0]}`;

  return (
    <>
      {isAuthor ? (
        <AuthorActionsCard
          eventId={eventId}
          editData={editData}
          className={className}
          deleteRedirectHref={deleteRedirectHref}
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
                contextId={eventId}
                contextType="event"
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
              contextId={eventId}
              contextType="event"
              label={contactLabel}
              icon={<MessageCircle className="size-4" aria-hidden />}
            />
          </Card>
        </>
      )}

      {volunteersNeeded != null && volunteersNeeded > 0 ? (
        <VolunteersCard
          eventId={eventId}
          isAuthor={isAuthor}
          initialVolunteering={initialVolunteering}
          volunteersNeeded={volunteersNeeded}
          volunteersRegistered={volunteersRegistered}
          volunteers={volunteers}
          className={className}
        />
      ) : null}

      <EventParticipantsCard
        eventId={eventId}
        isAuthor={isAuthor}
        initialParticipating={initialParticipating}
        participantsCount={participantsCount}
        participants={participants}
        className={className}
      />

      {sourceInitiative ? (
        <SourceInitiativeCard
          initiative={sourceInitiative}
          className={className}
        />
      ) : null}
    </>
  );
}

function AuthorActionsCard({
  eventId,
  editData,
  className,
  deleteRedirectHref,
}: {
  eventId: string;
  editData?: EventEditData;
  className?: string;
  deleteRedirectHref: string;
}) {
  const { openEventModal } = useCreationModals();
  const [deleteOpen, setDeleteOpen] = useState(false);

  function handleDuplicate() {
    if (!editData) return;
    openEventModal({
      initialData: editData,
      duplicateMode: true,
    });
  }

  return (
    <Card className={cn("gap-6 md:p-5", className)}>
      <div className="space-y-1">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-text">
          <CalendarDays className="size-5 shrink-0 text-orange" aria-hidden />
          Gérez votre événement
        </h2>
        <p className="text-sm font-medium text-muted">
          Modifiez les détails ou dupliquez cet événement.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          className="w-full cursor-pointer"
          onClick={() =>
            openEventModal({ editId: eventId, initialData: editData })
          }
        >
          <Pencil className="size-4" aria-hidden />
          Modifier l&apos;événement
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full cursor-pointer"
          onClick={handleDuplicate}
          disabled={!editData}
        >
          <Copy className="size-4" aria-hidden />
          Dupliquer
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
      </div>
      <DeleteEventModal
        eventId={eventId}
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        redirectHref={deleteRedirectHref}
      />
    </Card>
  );
}

function VolunteersGauge({
  registered,
  needed,
}: {
  registered: number;
  needed: number;
}) {
  const progress = Math.min(100, Math.round((registered / needed) * 100));

  return (
    <div className="flex items-center gap-3">
      <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-orange transition-all"
          style={{
            width: `${Math.max(progress, registered > 0 ? 8 : 0)}%`,
          }}
        />
      </div>
      <span className="shrink-0 text-xs font-bold text-muted">
        {registered}/{needed}
      </span>
    </div>
  );
}

function VolunteersCard({
  eventId,
  isAuthor,
  initialVolunteering,
  volunteersNeeded,
  volunteersRegistered,
  volunteers,
  className,
}: {
  eventId: string;
  isAuthor: boolean;
  initialVolunteering: boolean;
  volunteersNeeded: number;
  volunteersRegistered: number;
  volunteers: EventVolunteer[];
  className?: string;
}) {
  return (
    <Card className={cn("gap-6 md:p-5", className)}>
      <div className="space-y-1">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-text">
          <Users className="size-5 shrink-0 text-orange" aria-hidden />
          Bénévoles
        </h2>
        <p className="text-sm font-medium text-muted">
          {isAuthor
            ? "Recherchez des bénévoles — vous pouvez aussi vous inscrire vous-même."
            : "L&apos;organisateur recherche des bénévoles pour cet événement."}
        </p>
      </div>
      <div className="space-y-3">
        <VolunteersGauge registered={volunteersRegistered} needed={volunteersNeeded} />
        {volunteers.length > 0 ? (
          <VolunteersAvatarRow
            volunteers={volunteers}
            eventId={eventId}
            isAuthor={isAuthor}
          />
        ) : null}
        <EventVolunteerButton
          eventId={eventId}
          initialVolunteering={initialVolunteering}
        />
      </div>
    </Card>
  );
}

function EventParticipantsCard({
  eventId,
  isAuthor,
  initialParticipating,
  participantsCount,
  participants,
  className,
}: {
  eventId: string;
  isAuthor: boolean;
  initialParticipating: boolean;
  participantsCount: number;
  participants: EventVolunteer[];
  className?: string;
}) {
  return (
    <Card className={cn("gap-6 md:p-5", className)}>
      <div className="space-y-1">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-text">
          <CalendarCheck className="size-5 shrink-0 text-orange" aria-hidden />
          {isAuthor ? "Participants" : "Participer"}
        </h2>
        <p className="text-sm font-medium text-muted">
          {isAuthor
            ? participantsCount === 0
              ? "Les premières inscriptions arriveront bientôt !"
              : `${participantsCount} voisin${participantsCount !== 1 ? "·es" : "·e"} se ${participantsCount !== 1 ? "sont inscrits" : "s'est inscrit·e"} !`
            : "Vous souhaitez participer à cet événement ?"}
        </p>
      </div>
      <div className="space-y-3">
        {participantsCount > 0 ? (
          <p className="text-sm font-semibold text-text">
            {participantsCount} participant{participantsCount !== 1 ? "s" : ""}
          </p>
        ) : null}
        {participants.length > 0 ? (
          <ParticipantsAvatarRow
            participants={participants}
            eventId={eventId}
            isAuthor={isAuthor}
          />
        ) : null}
        <EventParticipantButton
          eventId={eventId}
          initialParticipating={initialParticipating}
        />
      </div>
    </Card>
  );
}

function SourceInitiativeCard({
  initiative,
  className,
}: {
  initiative: SourceInitiative;
  className?: string;
}) {
  return (
    <Card className={cn("relative space-y-2 md:p-5", className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="flex items-center gap-1 text-xs font-semibold uppercase text-mint">
          <Sparkles className="size-3.5" aria-hidden />
          Issu de l&apos;initiative
        </p>
        <Link
          href={ROUTES.initiatives.detail(initiative.id)}
          className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-sm text-muted transition hover:bg-warm hover:text-text"
          aria-label={`Voir l'initiative : ${initiative.title}`}
        >
          <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      </div>
      <p className="text-sm font-semibold text-text">{initiative.title}</p>
    </Card>
  );
}

function DeleteEventModal({
  eventId,
  open,
  onClose,
  redirectHref,
}: {
  eventId: string;
  open: boolean;
  onClose: () => void;
  redirectHref: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteEvent(eventId);
    setDeleting(false);
    if ("success" in result) {
      onClose();
      router.push(redirectHref);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeDisabled={deleting}
      title="Supprimer l'événement"
      showCloseButton
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-sm font-medium text-muted">
          Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est
          irréversible.
        </p>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={deleting}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Suppression…" : "Supprimer"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
