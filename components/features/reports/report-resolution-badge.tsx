"use client";

import {
  getReportResolutionBadgeContent,
  getReportStatusBadgeClassName,
  REPORT_RESOLUTION,
} from "@/lib/constants/statuses";
import type { ReportResolutionMeta } from "@/lib/queries/report-resolution-meta";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MultilineText } from "@/components/ui/multiline-text";
import { cn } from "@/lib/utils/cn";
import { getTrimmedMultilineText } from "@/lib/utils/multiline-text";

type Props = {
  status: string;
  resolution: string | null;
  meta: ReportResolutionMeta | null;
  suspensionReason?: string | null;
};

function BadgeContent({
  content,
}: {
  content: ReturnType<typeof getReportResolutionBadgeContent>;
}) {
  if (content.variant === "split") {
    return (
      <>
        <span>{content.headline}</span>
        <span>{content.byline}</span>
      </>
    );
  }

  return content.label;
}

export function ReportResolutionBadge({
  status,
  resolution,
  meta,
  suspensionReason,
}: Props) {
  const content = getReportResolutionBadgeContent(status, resolution, meta);
  const className = getReportStatusBadgeClassName(status, resolution);

  if (resolution !== REPORT_RESOLUTION.content_suspended) {
    return (
      <span className={className}>
        <BadgeContent content={content} />
      </span>
    );
  }

  const reason = getTrimmedMultilineText(suspensionReason);

  return (
    <Popover>
      <PopoverTrigger
        nativeButton
        render={
          <button
            type="button"
            className={cn(className, "cursor-pointer hover:bg-orange/20")}
            aria-label="Voir la raison de la suspension"
          >
            <BadgeContent content={content} />
          </button>
        }
      />
      <PopoverContent side="left" className="max-w-xs text-xs">
        <div className="space-y-1">
          <p className="font-semibold text-text">Raison de la suspension :</p>
          {reason ? (
            <MultilineText
              text={suspensionReason}
              className="font-medium leading-4 text-muted"
            />
          ) : (
            <p className="font-medium leading-4 text-muted">
              Aucune raison enregistrée.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
