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
  const Icon = getAnnouncementTypeIcon(type);
  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden />;
}
