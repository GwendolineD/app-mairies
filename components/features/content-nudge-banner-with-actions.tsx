"use client";

import { useState, useTransition } from "react";

import { ContentNudgeBanner } from "@/components/features/content-nudge-banner";
import { DeleteAnnouncementModal } from "@/components/features/delete-announcement-modal";
import { DeleteEventModal } from "@/components/features/delete-event-modal";
import { DeleteInitiativeModal } from "@/components/features/delete-initiative-modal";
import { snoozeContentNudge, type ContentType } from "@/lib/actions/content-lifecycle";
import type { AnnouncementType } from "@/lib/constants/announcement-types";
import type { NudgeableContent } from "@/lib/utils/content-nudge";

type Props = {
  content: NudgeableContent;
  contentId: string;
  contentTitle: string;
  contentType: ContentType;
  announcementType?: AnnouncementType;
};

export function ContentNudgeBannerWithActions({
  content,
  contentId,
  contentTitle,
  contentType,
  announcementType,
}: Props) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSnooze() {
    startTransition(async () => {
      await snoozeContentNudge(contentType, contentId);
    });
  }

  return (
    <>
      <ContentNudgeBanner
        content={content}
        contentId={contentId}
        contentTitle={contentTitle}
        onDelete={() => setDeleteOpen(true)}
        onSnooze={handleSnooze}
        snoozeLoading={isPending}
      />

      {contentType === "announcement" && announcementType ? (
        <DeleteAnnouncementModal
          announcementId={contentId}
          announcementType={announcementType}
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
        />
      ) : null}

      {contentType === "initiative" ? (
        <DeleteInitiativeModal
          initiativeId={contentId}
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
        />
      ) : null}

      {contentType === "event" ? (
        <DeleteEventModal
          eventId={contentId}
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
        />
      ) : null}
    </>
  );
}
