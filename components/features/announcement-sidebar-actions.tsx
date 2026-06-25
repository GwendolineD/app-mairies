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
import { cn } from "@/lib/utils/cn";

type Props = {
  isAuthor: boolean;
  announcementId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  memberSince: string;
  contactLabel: string;
  editData?: AnnouncementEditData;
  className?: string;
};

export function AnnouncementSidebarActions({
  isAuthor,
  announcementId,
  authorName,
  authorAvatarUrl,
  memberSince,
  contactLabel,
  editData,
  className,
}: Props) {
  const { openAnnouncementModal } = useCreationModals();
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isAuthor) {
    return (
      <Card className={cn("space-y-4 md:p-5", className)}>
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
          variant="outline"
          className="w-full cursor-pointer border-coral bg-surface text-coral hover:bg-coral/5"
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
    <Card className={cn("space-y-4 md:p-5", className)}>
      <h2 className="text-lg font-semibold text-text">Contact</h2>
      <div className="flex items-center gap-3">
        <UserAvatar
          name={authorName}
          url={authorAvatarUrl}
          size="sm"
          className="md:size-10"
        />
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
