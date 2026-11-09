"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Copy,
  MessageCircle,
  Pencil,
  Sparkles,
  Trash2,
} from "lucide-react";
import { ContactAnnouncementButton } from "@/components/features/contact-announcement-button";
import { useCreationModals } from "@/components/features/creation-modal-context";
import { EventEngagementButton } from "@/components/features/event-engagement-button";
import { ParticipantsAvatarRow } from "@/components/features/event-participants-list";
import { VolunteersAvatarRow } from "@/components/features/event-volunteers-list";
import { DeleteEventModal } from "@/components/features/delete-event-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { CONTENT_ICONS } from "@/lib/constants/content-icons";
import { ROUTES } from "@/lib/constants/routes";
import type { EventVolunteer } from "@/lib/queries/events";
import type { EventEditData } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { formatHeadcountLabel } from "@/lib/utils/event-headcount";

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
  /** Member rows — internal (pagination, avatar overflow). */
  volunteersRegistrations?: number;
  /** Rows + companions — the figure shown on the gauge. */
  volunteersHeadcount?: number;
  volunteers?: EventVolunteer[];
  /** null = not volunteering; number = companions declared. */
  initialVolunteerGuests?: number | null;
  participantsRegistrations?: number;
  participantsHeadcount?: number;
  participants?: EventVolunteer[];
  /** null = not participating; number = companions declared. */
  initialParticipantGuests?: number | null;
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
  volunteersRegistrations = 0,
  volunteersHeadcount = 0,
  volunteers = [],
  initialVolunteerGuests = null,
  participantsRegistrations = 0,
  participantsHeadcount = 0,
  participants = [],
  initialParticipantGuests = null,
  editData,
  sourceInitiative,
  className,
  deleteRedirectHref = ROUTES.evenements.list,
}: Props) {
  const contactLabel = `Contacter ${authorName.split(" ")[0]}`;

  const contactCard = !isAuthor ? (
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
            className="py-3"
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
  ) : null;

  return (
    <>
      {volunteersNeeded != null && volunteersNeeded > 0 ? (
        <VolunteersCard
          eventId={eventId}
          isAuthor={isAuthor}
          initialGuestsCount={initialVolunteerGuests}
          volunteersNeeded={volunteersNeeded}
          registrationsCount={volunteersRegistrations}
          headcount={volunteersHeadcount}
          volunteers={volunteers}
          className={className}
        />
      ) : null}

      <EventParticipantsCard
        eventId={eventId}
        isAuthor={isAuthor}
        initialGuestsCount={initialParticipantGuests}
        registrationsCount={participantsRegistrations}
        headcount={participantsHeadcount}
        participants={participants}
        className={className}
      />

      {contactCard}

      {isAuthor ? (
        <AuthorActionsCard
          eventId={eventId}
          editData={editData}
          className={className}
          deleteRedirectHref={deleteRedirectHref}
        />
      ) : null}

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
          <CONTENT_ICONS.eventManage className="size-5 shrink-0 text-orange" aria-hidden />
          Gérez votre événement
        </h2>
        <p className="text-sm font-medium text-muted">
          Modifiez les détails ou dupliquez cet événement.
        </p>
      </div>
      <div className="flex flex-col gap-4">
        <Button
          type="button"
          className="w-full cursor-pointer max-md:py-3"
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
          className="w-full cursor-pointer max-md:py-3"
          onClick={handleDuplicate}
          disabled={!editData}
        >
          <Copy className="size-4" aria-hidden />
          Dupliquer
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full cursor-pointer border-coral bg-surface text-coral hover:bg-coral/5 max-md:py-3"
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
  initialGuestsCount,
  volunteersNeeded,
  registrationsCount,
  headcount,
  volunteers,
  className,
}: {
  eventId: string;
  isAuthor: boolean;
  initialGuestsCount: number | null;
  volunteersNeeded: number;
  registrationsCount: number;
  headcount: number;
  volunteers: EventVolunteer[];
  className?: string;
}) {
  return (
    <Card className={cn("gap-6 md:p-5", className)}>
      <div className="space-y-1">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-text">
          <CONTENT_ICONS.eventVolunteers className="size-5 shrink-0 text-orange" aria-hidden />
          Bénévoles
        </h2>
        <p className="text-sm font-medium text-muted">
          {isAuthor
            ? "Recherchez des bénévoles — vous pouvez aussi vous inscrire vous-même."
            : "L'organisateur recherche des bénévoles pour cet événement."}
        </p>
      </div>
      <div className="space-y-3">
        <VolunteersGauge registered={headcount} needed={volunteersNeeded} />
        {volunteers.length > 0 ? (
          <VolunteersAvatarRow
            volunteers={volunteers}
            registrationsCount={registrationsCount}
            headcount={headcount}
            eventId={eventId}
            isAuthor={isAuthor}
          />
        ) : null}
        <EventEngagementButton
          kind="volunteer"
          eventId={eventId}
          initialGuestsCount={initialGuestsCount}
        />
      </div>
    </Card>
  );
}

function EventParticipantsCard({
  eventId,
  isAuthor,
  initialGuestsCount,
  registrationsCount,
  headcount,
  participants,
  className,
}: {
  eventId: string;
  isAuthor: boolean;
  initialGuestsCount: number | null;
  registrationsCount: number;
  headcount: number;
  participants: EventVolunteer[];
  className?: string;
}) {
  return (
    <Card className={cn("gap-6 md:p-5", className)}>
      <div className="space-y-1">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-text">
          <CONTENT_ICONS.eventParticipants className="size-5 shrink-0 text-orange" aria-hidden />
          {isAuthor ? "Participants" : "Participer"}
        </h2>
        <p className="text-sm font-medium text-muted">
          {isAuthor
            ? headcount === 0
              ? "Les premières inscriptions arriveront bientôt !"
              : "Ça se remplit ! Voici qui vient."
            : "Vous souhaitez participer à cet événement ? Venez accompagné·e si vous voulez."}
        </p>
      </div>
      <div className="space-y-3">
        {headcount > 0 ? (
          <p className="text-sm font-semibold text-text">{formatHeadcountLabel(headcount)}</p>
        ) : null}
        {participants.length > 0 ? (
          <ParticipantsAvatarRow
            participants={participants}
            registrationsCount={registrationsCount}
            headcount={headcount}
            eventId={eventId}
            isAuthor={isAuthor}
          />
        ) : null}
        <EventEngagementButton
          kind="participant"
          eventId={eventId}
          initialGuestsCount={initialGuestsCount}
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
          Née d&apos;une idée de voisin·e
        </p>
        <Link
          href={ROUTES.initiatives.detail(initiative.id)}
          className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-sm text-muted transition hover:bg-warm hover:text-text"
          aria-label={`Voir l'idée : ${initiative.title}`}
        >
          <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      </div>
      <p className="text-sm font-semibold text-text">{initiative.title}</p>
    </Card>
  );
}
