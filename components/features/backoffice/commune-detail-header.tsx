import { CommuneAccessStatusControl } from "@/components/features/backoffice/commune-access-status-control";
import { PageHeading } from "@/components/ui/page-heading";
import { formatShortDate } from "@/lib/utils/format-date";
import type { AccessStatus } from "@/lib/types";

type Props = {
  name: string;
  postcode: string | null;
  inseeCode: string;
  createdAt: string;
  communeId: string;
  accessStatus: AccessStatus;
};

export function CommuneDetailHeader({
  name,
  postcode,
  inseeCode,
  createdAt,
  communeId,
  accessStatus,
}: Props) {
  const title = postcode ? `${name} (${postcode})` : name;

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeading title={title} className="min-w-0 flex-1" />
        <CommuneAccessStatusControl
          communeId={communeId}
          currentStatus={accessStatus}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-muted">
        <p>créé le {formatShortDate(createdAt)}</p>
        <p>INSEE {inseeCode}</p>
      </div>
    </div>
  );
}
