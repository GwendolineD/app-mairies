"use client";

import { useEffect, useState, useTransition } from "react";
import { ChevronRight, Heart, MessageCircle } from "lucide-react";
import { ContactAnnouncementButton } from "@/components/features/contact-announcement-button";
import { LoadMoreLink } from "@/components/ui/load-more-link";
import { Modal } from "@/components/ui/modal";
import { UserAvatar } from "@/components/ui/user-avatar";
import { fetchMoreInitiativeSupporters } from "@/lib/actions/initiatives";
import { formatDisplayName } from "@/lib/utils/display-name";
import { cn } from "@/lib/utils/cn";
import type { InitiativeSupporter } from "@/lib/queries/initiatives";

type Props = {
  supporters: InitiativeSupporter[];
  totalCount: number;
  initiativeId: string;
  isAuthor: boolean;
  maxVisible?: number;
  className?: string;
};

function getSupporterDisplayName(supporter: InitiativeSupporter): string {
  if (supporter.displayName) return supporter.displayName;
  if (supporter.firstName && supporter.lastName) {
    return formatDisplayName(supporter.firstName, supporter.lastName);
  }
  return supporter.firstName || "Voisin·e";
}

function getSupporterFullName(supporter: InitiativeSupporter): string {
  if (supporter.displayName) return supporter.displayName;
  return [supporter.firstName, supporter.lastName].filter(Boolean).join(" ") || "Voisin·e";
}

export function SupportersAvatarRow({
  supporters,
  totalCount,
  initiativeId,
  isAuthor,
  maxVisible = 5,
  className,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  if (supporters.length === 0) {
    return null;
  }

  const visibleSupporters = supporters.slice(0, maxVisible);
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
            {visibleSupporters.map((supporter, index) => (
              <div
                key={supporter.membershipId}
                className="relative rounded-full ring-2 ring-surface"
                style={{ zIndex: maxVisible - index }}
              >
                <UserAvatar
                  name={getSupporterDisplayName(supporter)}
                  url={supporter.avatarUrl}
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

      <SupportersModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        supporters={supporters}
        totalCount={totalCount}
        initiativeId={initiativeId}
        isAuthor={isAuthor}
      />
    </>
  );
}

function SupportersModal({
  open,
  onClose,
  supporters: initialSupporters,
  totalCount,
  initiativeId,
  isAuthor,
}: {
  open: boolean;
  onClose: () => void;
  supporters: InitiativeSupporter[];
  totalCount: number;
  initiativeId: string;
  isAuthor: boolean;
}) {
  const [items, setItems] = useState(initialSupporters);
  const [loadingMore, startLoadingMore] = useTransition();

  useEffect(() => {
    if (open) {
      setItems(initialSupporters);
    }
  }, [open, initialSupporters]);

  const remaining = Math.max(0, totalCount - items.length);

  function handleLoadMore() {
    startLoadingMore(async () => {
      const next = await fetchMoreInitiativeSupporters(initiativeId, items.length);
      setItems((prev) => {
        const existingIds = new Set(prev.map((s) => s.membershipId));
        const unique = next.filter((s) => !existingIds.has(s.membershipId));
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
          <Heart className="size-4 shrink-0 text-coral" aria-hidden />
          {totalCount} soutien{totalCount !== 1 ? "s" : ""}
        </span>
      }
      showCloseButton
      size="sm"
    >
      <div className="max-h-[60vh] space-y-2 overflow-y-auto">
        {items.map((supporter) => (
          <SupporterRow
            key={supporter.membershipId}
            supporter={supporter}
            initiativeId={initiativeId}
            showContactButton={isAuthor}
          />
        ))}
        {remaining > 0 ? (
          <div className="pt-2 text-center">
            <LoadMoreLink
              label={`${remaining} autre${remaining !== 1 ? "s" : ""} soutien${remaining !== 1 ? "s" : ""} · Voir plus`}
              onClick={handleLoadMore}
              pending={loadingMore}
            />
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

function SupporterRow({
  supporter,
  initiativeId,
  showContactButton,
}: {
  supporter: InitiativeSupporter;
  initiativeId: string;
  showContactButton: boolean;
}) {
  const displayName = getSupporterDisplayName(supporter);
  const fullName = getSupporterFullName(supporter);

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg p-2 transition hover:bg-warm">
      <div className="flex min-w-0 items-center gap-3">
        <UserAvatar name={displayName} url={supporter.avatarUrl} size="sm" />
        <span className="truncate text-sm font-semibold text-text">{fullName}</span>
      </div>
      {showContactButton ? (
        <ContactAnnouncementButton
          contextId={initiativeId}
          contextType="initiative"
          label="Contacter"
          icon={<MessageCircle className="size-4" aria-hidden />}
          className="h-8 w-auto shrink-0 gap-1.5 px-3 py-0 text-xs"
        />
      ) : null}
    </div>
  );
}
