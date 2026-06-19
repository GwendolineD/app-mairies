import Link from "next/link";
import { Eye } from "lucide-react";
import { ROUTES } from "@/lib/constants/routes";
import { buildRelatedReportsListQuery } from "@/lib/utils/report-list-params";
import type { SortMode } from "@/lib/utils/search-params";

type Props = {
  count: number;
  contextLabel: string;
  title: string;
  tri: SortMode;
};

export function ReportRelatedCountLink({
  count,
  contextLabel,
  title,
  tri,
}: Props) {
  return (
    <Link
      href={`${ROUTES.mairie.signalements}${buildRelatedReportsListQuery(title, tri)}`}
      className="inline-flex items-center gap-1 text-xs font-medium text-purple hover:underline"
    >
      Déjà {count} signalement{count > 1 ? "s" : ""} pour {contextLabel}
      <Eye className="size-3.5 shrink-0" aria-hidden />
    </Link>
  );
}
