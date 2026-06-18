"use client";

import { useState } from "react";
import { ChevronRight, MessageCircle, Users } from "lucide-react";
import { ContactAnnouncementButton } from "@/components/features/contact-announcement-button";
import { Modal } from "@/components/ui/modal";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatDisplayName } from "@/lib/utils/display-name";
import { cn } from "@/lib/utils/cn";
import type { InitiativeSupporter } from "@/lib/queries/initiatives";

type Props = {
  volunteers: InitiativeSupporter[];
  eventId: string;
  isAuthor: boolean;
  maxVisible?: number;
  className?: string;
};

function getVolunteerDisplayName(volunteer: InitiativeSupporter): string {
  if (volunteer.displayName) return volunteer.displayName;
  if (volunteer.firstName && volunteer.lastName) {
    return formatDisplayName(volunteer.firstName, volunteer.lastName);
  }
  return volunteer.firstName || "Voisin·e";
}

function getVolunteerFullName(volunteer: InitiativeSupporter): string {
  if (volunteer.displayName) return volunteer.displayName;
  return [volunteer.firstName, volunteer.lastName].filter(Boolean).join(" ") || "Voisin·e";
}

export function VolunteersAvatarRow({
  volunteers,
  eventId,
  isAuthor,
  maxVisible = 5,
  className,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  if (volunteers.length === 0) {
    return null;
  }

  const visibleVolunteers = volunteers.slice(0, maxVisible);
  const overflowCount = volunteers.length - maxVisible;

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className={cn(
          "flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg p-2 transition hover:bg-warm",
          className,
        )}
      >
        <div className="flex items-center">
          <div className="flex -space-x-2">
            {visibleVolunteers.map((volunteer, index) => (
              <div
                key={volunteer.membershipId}
                className="relative rounded-full ring-2 ring-surface"
                style={{ zIndex: maxVisible - index }}
              >
                <UserAvatar
                  name={getVolunteerDisplayName(volunteer)}
                  url={volunteer.avatarUrl}
                  size="sm"
                />
              </div>
            ))}
            {overflowCount > 0 ? (
              <div
                className="relative flex size-8 items-center justify-center rounded-full bg-warm text-xs font-bold text-muted ring-2 ring-surface"
                style={{ zIndex: 0 }}
              >
                +{overflowCount}
              </div>
            ) : null}
          </div>
        </div>
        <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
      </button>

      <VolunteersModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        volunteers={volunteers}
        eventId={eventId}
        isAuthor={isAuthor}
      />
    </>
  );
}

function VolunteersModal({
  open,
  onClose,
  volunteers,
  eventId,
  isAuthor,
}: {
  open: boolean;
  onClose: () => void;
  volunteers: InitiativeSupporter[];
  eventId: string;
  isAuthor: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <span className="flex items-center gap-1.5">
          <Users className="size-4 shrink-0 text-orange" aria-hidden />
          {volunteers.length} bénévole{volunteers.length !== 1 ? "s" : ""}
        </span>
      }
      showCloseButton
      size="sm"
    >
      <div className="max-h-[60vh] space-y-2 overflow-y-auto">
        {volunteers.map((volunteer) => (
          <VolunteerRow
            key={volunteer.membershipId}
            volunteer={volunteer}
            eventId={eventId}
            showContactButton={isAuthor}
          />
        ))}
      </div>
    </Modal>
  );
}

function VolunteerRow({
  volunteer,
  eventId,
  showContactButton,
}: {
  volunteer: InitiativeSupporter;
  eventId: string;
  showContactButton: boolean;
}) {
  const displayName = getVolunteerDisplayName(volunteer);
  const fullName = getVolunteerFullName(volunteer);

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg p-2 transition hover:bg-warm">
      <div className="flex min-w-0 items-center gap-3">
        <UserAvatar name={displayName} url={volunteer.avatarUrl} size="sm" />
        <span className="truncate text-sm font-semibold text-text">{fullName}</span>
      </div>
      {showContactButton ? (
        <ContactAnnouncementButton
          contextId={eventId}
          contextType="event"
          label="Contacter"
          icon={<MessageCircle className="size-4" aria-hidden />}
          className="h-8 w-auto shrink-0 gap-1.5 px-3 py-0 text-xs"
        />
      ) : null}
    </div>
  );
}
