"use client";

import { useTransition } from "react";

import { ContentNudgeBanner } from "@/components/features/content-nudge-banner";
import { snoozeContentNudge, type ContentType } from "@/lib/actions/content-lifecycle";
import type { NudgeableContent } from "@/lib/utils/content-nudge";

type Props = {
  content: NudgeableContent;
  contentId: string;
  contentTitle: string;
  contentType: ContentType;
  onDelete?: () => void;
  onEditDeadline?: () => void;
};

export function ContentNudgeBannerWithActions({
  content,
  contentId,
  contentTitle,
  contentType,
  onDelete,
  onEditDeadline,
}: Props) {
  const [isPending, startTransition] = useTransition();

  function handleSnooze() {
    startTransition(async () => {
      await snoozeContentNudge(contentType, contentId);
    });
  }

  return (
    <ContentNudgeBanner
      content={content}
      contentId={contentId}
      contentTitle={contentTitle}
      onDelete={onDelete}
      onEditDeadline={onEditDeadline}
      onSnooze={handleSnooze}
      snoozeLoading={isPending}
    />
  );
}
