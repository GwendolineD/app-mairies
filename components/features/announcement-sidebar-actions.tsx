"use client";

import { useState } from "react";
import { MessageCircle, Pencil, Trash2 } from "lucide-react";
import { useCreationModals } from "@/components/features/creation-modal-context";
import { ContactAnnouncementButton } from "@/components/features/contact-announcement-button";
import { DeleteAnnouncementModal } from "@/components/features/delete-announcement-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { AnnouncementEditData } from "@/lib/types";

type Props = {
  isAuthor: boolean;
  announcementId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  memberSince: string;
  contactLabel: string;
  editData?: AnnouncementEditData;
};

export function AnnouncementSidebarActions({
  isAuthor,
  announcementId,
  authorName,
  authorAvatarUrl,
  memberSince,
  contactLabel,
  editData,
}: Props) {
  const { openAnnouncementModal } = useCreationModals();
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isAuthor) {
    return (
      <Card className="space-y-4 p-5">
        <h2 className="text-lg font-semibold text-text">Votre annonce</h2>
        <Button
          type="button"
          className="w-full cursor-pointer"
          onClick={() => openAnnouncementModal({ editId: announcementId, initialData: editData })}
        >
          <Pencil className="size-4" aria-hidden />
          Modifier l&apos;annonce
        </Button>
        <Button
          type="button"
          variant="danger"
          className="w-full cursor-pointer"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="size-4" aria-hidden />
          Supprimer
        </Button>
        <DeleteAnnouncementModal
          announcementId={announcementId}
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
        />
      </Card>
    );
  }

  return (
    <Card className="space-y-4 p-5">
      <h2 className="text-lg font-semibold text-text">Contact</h2>
      <div className="flex items-center gap-3">
        <UserAvatar name={authorName} url={authorAvatarUrl} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text">{authorName}</p>
          <p className="text-xs text-muted">{memberSince}</p>
        </div>
      </div>
      <ContactAnnouncementButton
        contextId={announcementId}
        label={contactLabel}
        icon={<MessageCircle className="size-4" aria-hidden />}
      />
    </Card>
  );
}
