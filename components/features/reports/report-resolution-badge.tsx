import {
  getReportResolutionBadgeContent,
  getReportStatusBadgeClassName,
} from "@/lib/constants/statuses";
import type { ReportResolutionMeta } from "@/lib/queries/report-resolution-meta";

type Props = {
  status: string;
  resolution: string | null;
  meta: ReportResolutionMeta | null;
};

export function ReportResolutionBadge({ status, resolution, meta }: Props) {
  const content = getReportResolutionBadgeContent(status, resolution, meta);

  return (
    <span className={getReportStatusBadgeClassName(status, resolution)}>
      {content.variant === "split" ? (
        <>
          <span>{content.headline}</span>
          <span>{content.byline}</span>
        </>
      ) : (
        content.label
      )}
    </span>
  );
}
