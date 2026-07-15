import { ContentNudgeBannerWithActions } from "@/components/features/content-nudge-banner-with-actions";
import { getContentNudgeReason, type NudgeableContent } from "@/lib/utils/content-nudge";
import type { ContentType } from "@/lib/actions/content-lifecycle";
import type { AnnouncementType } from "@/lib/constants/announcement-types";

type Props = {
  content: NudgeableContent;
  contentId: string;
  contentTitle: string;
  contentType: ContentType;
  announcementType?: AnnouncementType;
};

/**
 * Server component that only renders the client banner if nudge conditions are met.
 * Avoids sending unnecessary JS to the client.
 */
export function ContentNudgeBannerServer({
  content,
  contentId,
  contentTitle,
  contentType,
  announcementType,
}: Props) {
  const reason = getContentNudgeReason(content);
  if (!reason) return null;

  return (
    <ContentNudgeBannerWithActions
      content={content}
      contentId={contentId}
      contentTitle={contentTitle}
      contentType={contentType}
      announcementType={announcementType}
    />
  );
}
