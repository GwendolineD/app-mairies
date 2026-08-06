"use client";

import { useEffect, useState, useTransition } from "react";
import { CalendarCheck, ChevronRight, MessageCircle } from "lucide-react";
import { ContactAnnouncementButton } from "@/components/features/contact-announcement-button";
import { LoadMoreLink } from "@/components/ui/load-more-link";
import { Modal } from "@/components/ui/modal";
import { UserAvatar } from "@/components/ui/user-avatar";
import { fetchMoreEventParticipants } from "@/lib/actions/events";
import { formatDisplayName } from "@/lib/utils/display-name";
import { cn } from "@/lib/utils/cn";
import type { EventVolunteer } from "@/lib/queries/events";

type Props = {
  participants: EventVolunteer[];
  totalCount: number;
  eventId: string;
  isAuthor: boolean;
  maxVisible?: number;
  className?: string;
};

function getDisplayName(p: EventVolunteer): string {
  if (p.displayName) return p.displayName;
  if (p.firstName && p.lastName) {
    return formatDisplayName(p.firstName, p.lastName);
  }
  return p.firstName || "Voisin·e";
}

function getFullName(p: EventVolunteer): string {
  if (p.displayName) return p.displayName;
  return [p.firstName, p.lastName].filter(Boolean).join(" ") || "Voisin·e";
}

export function ParticipantsAvatarRow({
  participants,
  totalCount,
  eventId,
  isAuthor,
  maxVisible = 5,
  className,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  if (participants.length === 0) return null;

  const visible = participants.slice(0, maxVisible);
  const overflowCount = Math.max(0, totalCount - maxVisible);

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
            {visible.map((p, index) => (
              <div
                key={p.membershipId}
                className="relative rounded-full ring-2 ring-surface"
                style={{ zIndex: maxVisible - index }}
              >
                <UserAvatar
                  name={getDisplayName(p)}
                  url={p.avatarUrl}
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

      <ParticipantsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        participants={participants}
        totalCount={totalCount}
        eventId={eventId}
        isAuthor={isAuthor}
      />
    </>
  );
}

function ParticipantsModal({
  open,
  onClose,
  participants: initialParticipants,
  totalCount,
  eventId,
  isAuthor,
}: {
  open: boolean;
  onClose: () => void;
  participants: EventVolunteer[];
  totalCount: number;
  eventId: string;
  isAuthor: boolean;
}) {
  const [items, setItems] = useState(initialParticipants);
  const [loadingMore, startLoadingMore] = useTransition();

  useEffect(() => {
    if (open) {
      setItems(initialParticipants);
    }
  }, [open, initialParticipants]);

  const remaining = Math.max(0, totalCount - items.length);

  function handleLoadMore() {
    startLoadingMore(async () => {
      const next = await fetchMoreEventParticipants(eventId, items.length);
      setItems((prev) => {
        const existingIds = new Set(prev.map((p) => p.membershipId));
        const unique = next.filter((p) => !existingIds.has(p.membershipId));
        return [...prev, ...unique];
      });
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <span className="flex items-center gap-1.5">
          <CalendarCheck className="size-4 shrink-0 text-orange" aria-hidden />
          {totalCount} participant{totalCount !== 1 ? "s" : ""}
        </span>
      }
      showCloseButton
      size="sm"
    >
      <div className="max-h-[60vh] space-y-2 overflow-y-auto">
        {items.map((p) => (
          <ParticipantRow
            key={p.membershipId}
            participant={p}
            eventId={eventId}
            showContactButton={isAuthor}
          />
        ))}
        {remaining > 0 ? (
          <div className="pt-2 text-center">
            <LoadMoreLink
              label={`${remaining} autre${remaining !== 1 ? "s" : ""} participant${remaining !== 1 ? "s" : ""} · Voir plus`}
              onClick={handleLoadMore}
              pending={loadingMore}
            />
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

function ParticipantRow({
  participant,
  eventId,
  showContactButton,
}: {
  participant: EventVolunteer;
  eventId: string;
  showContactButton: boolean;
}) {
  const displayName = getDisplayName(participant);
  const fullName = getFullName(participant);

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg p-2 transition hover:bg-warm">
      <div className="flex min-w-0 items-center gap-3">
        <UserAvatar name={displayName} url={participant.avatarUrl} size="sm" />
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
