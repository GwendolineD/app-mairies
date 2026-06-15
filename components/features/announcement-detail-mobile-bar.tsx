"use client";

import { useState } from "react";
import { MapPin, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { useCreationModals } from "@/components/features/creation-modal-context";
import { ContactAnnouncementButton } from "@/components/features/contact-announcement-button";
import { DeleteAnnouncementModal } from "@/components/features/delete-announcement-modal";
import { Button } from "@/components/ui/button";
import type { AnnouncementEditData } from "@/lib/types";

type Props = {
  isAuthor: boolean;
  announcementId: string;
  addressCity: string | null;
  contactLabel: string;
  editData?: AnnouncementEditData;
};

export function AnnouncementDetailMobileBar({
  isAuthor,
  announcementId,
  addressCity,
  contactLabel,
  editData,
}: Props) {
  const { openAnnouncementModal } = useCreationModals();
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0)+60px)] z-30 border-t border-border bg-surface px-4 py-3 md:hidden">
      <div className="flex items-center gap-3">
        {addressCity ? (
          <span className="flex items-center gap-1 text-xs text-muted">
            <MapPin className="size-3.5" aria-hidden />
            {addressCity}
          </span>
        ) : null}
        <div className="ml-auto flex items-center gap-2">
          {isAuthor ? (
            <>
              <Button
                size="sm"
                className="cursor-pointer"
                onClick={() => openAnnouncementModal({ editId: announcementId, initialData: editData })}
              >
                <Pencil className="size-3.5" aria-hidden />
                Modifier
              </Button>
              <Button
                size="sm"
                variant="danger"
                className="cursor-pointer"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="size-3.5" aria-hidden />
              </Button>
              <DeleteAnnouncementModal
                announcementId={announcementId}
                open={deleteOpen}
                onClose={() => setDeleteOpen(false)}
              />
            </>
          ) : (
            <ContactAnnouncementButton
              contextId={announcementId}
              label={contactLabel}
              icon={<MessageCircle className="size-4" aria-hidden />}
            />
          )}
        </div>
      </div>
    </div>
  );
}
