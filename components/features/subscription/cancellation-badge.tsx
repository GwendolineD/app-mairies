"use client";

import { formatShortDate } from "@/lib/utils/format-date";
import { Tooltip } from "@/components/ui/tooltip";

type CancellationBadgeProps = {
  createdAt: string;
  requesterName: string | null;
  comment: string;
};

export function CancellationBadge({
  createdAt,
  requesterName,
  comment,
}: CancellationBadgeProps) {
  return (
    <Tooltip
      side="right"
      content={
        <div className="max-w-52 space-y-1">
          <div>
            <span className="text-muted">Date : </span>
            <span>{formatShortDate(createdAt)}</span>
          </div>
          {requesterName && (
            <div>
              <span className="text-muted">Par : </span>
              <span>{requesterName}</span>
            </div>
          )}
          <div>
            <span className="text-muted">Motif : </span>
            <span className="break-words">{comment}</span>
          </div>
        </div>
      }
    >
      <span className="inline-flex cursor-default items-center rounded-full bg-coral/15 px-2.5 py-1 text-xs font-semibold text-coral">
        Résilié
      </span>
    </Tooltip>
  );
}
