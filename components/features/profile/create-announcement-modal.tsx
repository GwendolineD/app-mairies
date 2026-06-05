"use client";

import { useState } from "react";
import { AnnouncementForm } from "@/components/features/announcements/announcement-form";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ROUTES } from "@/lib/constants/routes";

type Props = {
  triggerLabel?: string;
  className?: string;
};

export function CreateAnnouncementModal({
  triggerLabel = "Créer ma première annonce",
  className,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} className={className}>
        {triggerLabel}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Créer une annonce"
        className="max-h-[90dvh] max-w-2xl overflow-y-auto"
      >
        <p className="mb-4 text-sm font-medium leading-5 text-muted">
          Une demande simple et précise donne envie aux voisin·es de répondre.
        </p>
        <AnnouncementForm
          compact
          redirectTo={`${ROUTES.profil}?tab=annonces`}
          submitLabel="Publier depuis mon profil"
        />
      </Modal>
    </>
  );
}
