// @ts-nocheck
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Copy, Pencil, Sparkles, Trash2, Users } from "lucide-react";
import { useCreationModals } from "@/components/features/creation-modal-context";
import { deleteEvent, duplicateEvent } from "@/lib/actions/events";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { ROUTES } from "@/lib/constants/routes";
import type { EventEditData } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

type SourceInitiative = {
  id: string;
  title: string;
};

type Props = {
  isAuthor: boolean;
  eventId: string;
  volunteersNeeded: number | null;
  editData?: EventEditData;
  sourceInitiative?: SourceInitiative | null;
  className?: string;
};

export function EventSidebarActions({
  isAuthor,
  eventId,
  volunteersNeeded,
  editData,
  sourceInitiative,
  className,
}: Props) {
  return (
    <>
      {isAuthor ? (
        <AuthorActionsCard
          eventId={eventId}
          editData={editData}
          className={className}
        />
      ) : null}

      {volunteersNeeded != null && volunteersNeeded > 0 ? (
        <VolunteersCard
          volunteersNeeded={volunteersNeeded}
          className={className}
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
}: {
  eventId: string;
  editData?: EventEditData;
  className?: string;
}) {
  const { openEventModal } = useCreationModals();
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  async function handleDuplicate() {
    setDuplicating(true);
    const result = await duplicateEvent(eventId);
    setDuplicating(false);
    if ("id" in result) {
      router.push(ROUTES.evenements.detail(result.id));
    }
  }

  return (
    <Card className={cn("space-y-4 md:p-5", className)}>
      <h2 className="text-lg font-semibold text-text">Gérez votre événement</h2>
      <p className="text-sm font-medium text-muted">
        Modifiez les détails ou dupliquez cet événement.
      </p>
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
        disabled={duplicating}
      >
        <Copy className="size-4" aria-hidden />
        {duplicating ? "Duplication…" : "Dupliquer"}
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
      <DeleteEventModal
        eventId={eventId}
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
      />
    </Card>
  );
}

function VolunteersCard({
  volunteersNeeded,
  className,
}: {
  volunteersNeeded: number;
  className?: string;
}) {
  return (
    <Card className={cn("space-y-3 md:p-5", className)}>
      <h2 className="text-lg font-semibold text-text">Bénévoles</h2>
      <p className="text-sm font-medium text-muted">
        L&apos;organisateur recherche des bénévoles pour cet événement.
      </p>
      <div className="flex items-center gap-2 text-orange">
        <Users className="size-5" aria-hidden />
        <span className="text-base font-bold">
          {volunteersNeeded} bénévole{volunteersNeeded !== 1 ? "s" : ""} souhaité{volunteersNeeded !== 1 ? "s" : ""}
        </span>
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
}: {
  eventId: string;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteEvent(eventId);
    setDeleting(false);
    if ("success" in result) {
      onClose();
      router.push(ROUTES.evenements.list);
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
