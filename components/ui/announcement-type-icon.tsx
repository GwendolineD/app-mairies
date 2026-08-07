import { createElement } from "react";
import { getAnnouncementTypeIcon } from "@/lib/constants/announcement-types";

type Props = {
  type: string;
  className?: string;
  strokeWidth?: number;
};

export function AnnouncementTypeIcon({
  type,
  className,
  strokeWidth = 2,
}: Props) {
  return createElement(getAnnouncementTypeIcon(type), {
    className,
    strokeWidth,
    "aria-hidden": true,
  });
}
